import logging, os, json, re, datetime
from pathlib import Path
import asyncio


from dotenv import load_dotenv
from livekit.agents import (
    Agent,
    AgentSession,
    JobContext,
    JobProcess,
    MetricsCollectedEvent,
    RoomInputOptions,
    WorkerOptions,
    cli,
    metrics,
)
from livekit.agents.llm.chat_context import ChatContext
from livekit.plugins import noise_cancellation, silero
from livekit.plugins.turn_detector.multilingual import MultilingualModel

logger = logging.getLogger("agent")

load_dotenv(".env.local")

SESSION_DIR = Path("/tmp/livekit_session")
SESSION_DIR.mkdir(parents=True, exist_ok=True)

class ConversationMemory:
    """
    Minimal session memory to collect a turn-by-turn transcript and
    extract structured facts for downstream RAG/eligibility.
    """
    def __init__(self):
        self.started_at = datetime.datetime.utcnow().isoformat() + "Z"
        self.ended_at = None
        self.turns = []  # list of {"role": "user"|"assistant", "text": "..."}
        self.questions = {}  # q1, q2, q3, q4, q5 with user answers
        self.facts = {
            "full_name": None,
            "state": None,
            "dob": None,
            "case_numbers": [],
            "charges": [],
            "disposition_dates": [],
            "arrest_years": [],
        }

    def add_turn(self, role: str, text: str):
        if not text:
            return
        self.turns.append({"role": role, "text": text})
        if role == "user":
            self._heuristic_extract(text)

    def _heuristic_extract(self, text: str):
        # very naive regex-based extraction as a baseline; your RAG can refine later
        # state (2-letter)
        m = re.search(r"\b([A-Z]{2})\b", text)
        if m and not self.facts["state"]:
            self.facts["state"] = m.group(1)

        # dates (YYYY-MM-DD or MM/DD/YYYY)
        for d in re.findall(r"\b(\d{4}-\d{2}-\d{2}|\d{1,2}/\d{1,2}/\d{2,4})\b", text):
            # assume disposition dates for now; customize as needed
            self.facts["disposition_dates"].append(d)

        # case numbers (very rough)
        for cn in re.findall(r"\b([A-Z0-9\-]{6,})\b", text):
            if cn not in self.facts["case_numbers"]:
                self.facts["case_numbers"].append(cn)

        # years that look like arrest/conviction years
        for y in re.findall(r"\b(19\d{2}|20\d{2})\b", text):
            yy = int(y)
            if 1950 <= yy <= datetime.datetime.utcnow().year and yy not in self.facts["arrest_years"]:
                self.facts["arrest_years"].append(yy)

        # quick-and-dirty "charges" capture keywords
        for ch in re.findall(r"\b(dui|theft|petty theft|burglary|misdemeanor|felony|drug possession|assault)\b", text, re.I):
            c = ch.lower()
            if c not in self.facts["charges"]:
                self.facts["charges"].append(c)

        # full name (very naive: "my name is …")
        m = re.search(r"\bmy name is ([A-Z][a-z]+(?: [A-Z][a-z]+)+)\b", text, re.I)
        if m and not self.facts["full_name"]:
            self.facts["full_name"] = m.group(1)

        # DOB (naive)
        m = re.search(r"\b(dob|date of birth)\s*[:\-]?\s*(\d{1,2}/\d{1,2}/\d{2,4})\b", text, re.I)
        if m and not self.facts["dob"]:
            self.facts["dob"] = m.group(2)

    def finalize(self):
        self.ended_at = datetime.datetime.utcnow().isoformat() + "Z"

    def to_dict(self):
        return {
            "started_at": self.started_at,
            "ended_at": self.ended_at,
            "turns": self.turns,
            "questions": self.questions,
            "extracted_facts": self.facts,
        }

    def dump(self, path: Path):
        self.finalize()
        path.write_text(json.dumps(self.to_dict(), indent=2))


class Assistant(Agent):
    def __init__(self, memory: ConversationMemory, session_filename: str, session_obj) -> None:
        super().__init__(
            instructions="""You are conducting a survey for expungement assistance. Ask the user these 5 questions one at a time, and wait for their answer before moving to the next question:

Q1: Can you tell me about the conviction you're seeking to expunge?
Q2: When did this conviction occur? Please provide the date.
Q3: Have you completed all terms of your sentence, including probation and parole?
Q4: Have you had any other convictions since this one?
Q5: Are there any pending charges or cases against you currently?

Ask the questions sequentially. After getting an answer to one question, acknowledge it briefly and move to the next. Be friendly and conversational. Once you've asked all 5 questions, thank them and let them know you've saved their information.

When the user types "q", end the session immediately.
                """,
        )
        # Store reference to conversation memory
        self._memory = memory
        self._q_count = 0
        self.session_filename = session_filename
        self.session_obj = session_obj

    async def on_response(self, response, ctx: AgentSession):
        text = getattr(response, "text", None)
        if text:
            print("\n💬 Agent said:", text)
            self._memory.add_turn("assistant", text)
            # Check if this is a question
            if "?" in text:
                self._q_count += 1
                print(f"❓ Asked question #{self._q_count}")
            # ✅ Make the agent actually speak
            await ctx.say(text)

    async def on_user_message(self, message, ctx: AgentSession):
        text = getattr(message, "text", "").strip()
        text_lower = text.lower()
        
        print(f"\n🔊 User message received: '{text}'")
        self._memory.add_turn("user", text)
        
        if text_lower == "q":
            print("\n🛑 Detected 'q' command - ending session")
            # Save and close
            out_path = SESSION_DIR / self.session_filename
            self._memory.dump(out_path)
            print(f"\n📁 Session context saved to: {out_path}")
            
            # Close session after brief delay
            await asyncio.sleep(0.5)
            await self.session_obj.aclose()
        else:
            # Store the answer to the current question
            if 1 <= self._q_count <= 5:
                self._memory.questions[f"q{self._q_count}"] = text
                print(f"💾 Saved answer for Q{self._q_count}: {text}")


def prewarm(proc: JobProcess):
    proc.userdata["vad"] = silero.VAD.load()

async def entrypoint(ctx: JobContext):
    ctx.log_context_fields = {"room": ctx.room.name}

    # ✅ Create memory for THIS session only
    memory = ConversationMemory()
    
    # Generate unique session filename
    timestamp = datetime.datetime.utcnow().strftime("%Y%m%d_%H%M%S")
    session_filename = f"session_{timestamp}_{ctx.room.name}.json"

    # ✅ Proper AgentSession setup
    session = AgentSession(
        stt="assemblyai/universal-streaming:en",
        llm="openai/gpt-4.1-mini",
        tts="cartesia/sonic-2:9626c31c-bec5-4cca-baa8-f8ba9e84c8bc",
        turn_detection=MultilingualModel(),
        vad=ctx.proc.userdata["vad"],
        preemptive_generation=True,
    )
    
    # Create assistant with session info
    assistant = Assistant(memory, session_filename, session)

    usage_collector = metrics.UsageCollector()

    @session.on("metrics_collected")
    def _on_metrics_collected(ev: MetricsCollectedEvent):
        metrics.log_metrics(ev.metrics)
        usage_collector.collect(ev.metrics)

    # ✅ On shutdown, save memory to JSON
    async def log_usage_and_dump():
        summary = usage_collector.get_summary()
        logger.info(f"Usage: {summary}")
        
        # Extract from session.history.items
        messages = None
        
        if hasattr(session, 'history'):
            try:
                # items is a property that returns a list
                items = session.history.items
                if isinstance(items, list):
                    messages = items
                    print(f"\n🔍 ✅ Found {len(messages)} items in session.history.items")
                elif hasattr(items, '__iter__'):
                    messages = list(items)
                    print(f"\n🔍 ✅ Converted items to list: {len(messages)} items")
                else:
                    print(f"\n🔍 items type: {type(items)}")
            except Exception as e:
                print(f"\n🔍 Error accessing items: {e}")
        
        if messages:
            print(f"🔍 Processing {len(messages)} messages")
            q_num = 0
            for i, item in enumerate(messages):
                # Extract role and content from ChatMessage
                role = None
                content = None
                
                # Check if this is a ChatMessage
                if hasattr(item, '__class__'):
                    class_name = item.__class__.__name__
                    print(f"🔍 Item {i}: {class_name}")
                    if class_name == 'ChatMessage':
                        role = item.role if hasattr(item, 'role') else None
                        print(f"🔍 ChatMessage {i}: role={role}")
                        # content is a list of Content objects (or strings)
                        if hasattr(item, 'content') and isinstance(item.content, list):
                            print(f"🔍 Content is a list with {len(item.content)} items")
                            # Extract text from content items
                            content_parts = []
                            for j, content_item in enumerate(item.content):
                                print(f"🔍 Content item {j}: {type(content_item)}")
                                if isinstance(content_item, str):
                                    # Content item is a string
                                    content_parts.append(content_item)
                                    print(f"🔍 Found string: {content_item[:50]}...")
                                elif hasattr(content_item, 'text'):
                                    content_parts.append(content_item.text)
                                    print(f"🔍 Found text: {content_item.text[:50]}...")
                                elif hasattr(content_item, 'content'):
                                    content_parts.append(str(content_item.content))
                                    print(f"🔍 Found content: {str(content_item.content)[:50]}...")
                            content = ' '.join(content_parts) if content_parts else ''
                            print(f"🔍 Final content: {content[:50]}...")
                        elif hasattr(item, 'content'):
                            content = str(item.content)
                            print(f"🔍 Content is not a list: {content[:50]}...")
                    else:
                        print(f"🔍 Skipping non-ChatMessage item at index {i}: {class_name}")
                        continue
                else:
                    continue
                
                if role and content:
                    memory.add_turn(role, content)
                    print(f"📝 Added turn: {role}: {content[:50]}...")
                    
                    # Check if this is a question with an answer
                    if role == 'assistant' and '?' in content and i + 1 < len(messages):
                        next_item = messages[i + 1]
                        next_role = None
                        answer = None
                        
                        if hasattr(next_item, '__class__'):
                            next_class = next_item.__class__.__name__
                            if next_class == 'ChatMessage':
                                next_role = next_item.role if hasattr(next_item, 'role') else None
                                if hasattr(next_item, 'content') and isinstance(next_item.content, list):
                                    answer_parts = []
                                    for content_item in next_item.content:
                                        if isinstance(content_item, str):
                                            answer_parts.append(content_item)
                                        elif hasattr(content_item, 'text'):
                                            answer_parts.append(content_item.text)
                                    answer = ' '.join(answer_parts) if answer_parts else ''
                        
                        if next_role == 'user' and answer:
                            q_num += 1
                            memory.questions[f"q{q_num}"] = answer
                            print(f"💾 Extracted Q{q_num}: {answer}")
        else:
            print("❌ Could not find message history")
        
        out_path = SESSION_DIR / session_filename
        memory.dump(out_path)
        logger.info(f"Session context saved to: {out_path}")
        print(f"\n📁 Session saved to: {out_path}")
        print(f"📊 Memory has {len(memory.turns)} turns and {len(memory.questions)} questions")
        
        # Automatically parse the conversation JSON
        import sys
        import os
        sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))
        from parser import ConversationParser
        
        try:
            qa_parser = ConversationParser(str(out_path))
            qa_output_path = out_path.parent / f"{out_path.stem}_qa.json"
            qa_parser.create_formatted_json(str(qa_output_path))
            logger.info(f"Question-answer pairs saved to: {qa_output_path}")
            print(f"✅ Q&A JSON saved to: {qa_output_path}")
        except Exception as e:
            logger.error(f"Failed to parse conversation: {e}")
            print(f"❌ Failed to parse conversation: {e}")

    ctx.add_shutdown_callback(log_usage_and_dump)

    # ✅ Start agent session
    await session.start(
        agent=assistant,
        room=ctx.room,
        room_input_options=RoomInputOptions(
            noise_cancellation=noise_cancellation.BVC(),
        ),
    )

    await ctx.connect()


if __name__ == "__main__":
    cli.run_app(WorkerOptions(entrypoint_fnc=entrypoint, prewarm_fnc=prewarm))
