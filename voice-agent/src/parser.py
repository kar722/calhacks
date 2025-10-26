import json
import re
from datetime import datetime
from pathlib import Path
from typing import Dict, List


class ConversationParser:
    """
    Parses conversation JSON and extracts question-answer pairs.
    """
    
    def __init__(self, json_file_path: str):
        """
        Initialize the parser with a JSON file path.
        
        Args:
            json_file_path: Path to the conversation JSON file
        """
        self.json_file_path = Path(json_file_path)
        self.data = None
        
    def load_json(self) -> Dict:
        """
        Load the JSON file.
        
        Returns:
            Dictionary containing the conversation data
        """
        with open(self.json_file_path, 'r') as f:
            self.data = json.load(f)
        return self.data
    
    def text_to_boolean(self, text: str) -> bool:
        """
        Convert text to boolean based on positive/negative words.
        
        Args:
            text: The text to convert
        
        Returns:
            True if positive, False if negative
        """
        if not text:
            return False
        
        text_lower = text.lower().strip()
        
        # Check for "no" first (it should override everything else)
        if re.search(r'\bno\b', text_lower) or re.search(r'\bnope\b', text_lower) or re.search(r'\bnah\b', text_lower):
            return False
        
        # Positive indicators (only if no "no" was found)
        positive_patterns = [
            r'\byes\b', r'\byeah\b', r'\byep\b', r'\bya\b', 
            r'\bcorrect\b', r'\bright\b', r'\btrue\b',
            r'\bcompleted\b', r'\bdone\b', r'\bfinished\b', r'\bi do\b',
            r'\bsure\b', r'\bof course\b', r'\babsolutely\b', r'\bdefinitely\b'
        ]
        
        # Negative indicators
        negative_patterns = [
            r'\bnot\b', r'\bnever\b', r'\bnone\b', r'\bzero\b',
            r'\bi haven\'t\b', r'\bi haven\b', r'\bwrong\b', r'\bfalse\b',
            r'\bdidn\'t\b', r'\bdidnt\b', r'\bno i have not\b', r'\bno there are none\b'
        ]
        
        # Check for positive patterns
        for pattern in positive_patterns:
            if re.search(pattern, text_lower):
                return True
        
        # Check for negative patterns
        for pattern in negative_patterns:
            if re.search(pattern, text_lower):
                return False
        
        # Default to False if unclear
        return False
    
    def text_to_date(self, text: str) -> str:
        """
        Convert text description of a date to YYYY-MM-DD format.
        
        Args:
            text: The text to convert (e.g., "May 14th 2021", "May tenth two thousand and sixteen")
        
        Returns:
            Date string in YYYY-MM-DD format or the original text if parsing fails
        """
        if not text:
            return text
        
        text_lower = text.lower().strip()
        
        # Try to parse with dateutil (more flexible)
        try:
            from dateutil import parser
            parsed_date = parser.parse(text_lower)
            return parsed_date.strftime("%Y-%m-%d")
        except:
            pass
        
        # Manual parsing for common formats
        months = {
            'january': 1, 'jan': 1,
            'february': 2, 'feb': 2,
            'march': 3, 'mar': 3,
            'april': 4, 'apr': 4,
            'may': 5,
            'june': 6, 'jun': 6,
            'july': 7, 'jul': 7,
            'august': 8, 'aug': 8,
            'september': 9, 'sep': 9, 'sept': 9,
            'october': 10, 'oct': 10,
            'november': 11, 'nov': 11,
            'december': 12, 'dec': 12
        }
        
        # Number word to integer mapping
        number_words = {
            'first': 1, 'second': 2, 'third': 3, 'fourth': 4, 'fifth': 5,
            'sixth': 6, 'seventh': 7, 'eighth': 8, 'ninth': 9, 'tenth': 10,
            'eleventh': 11, 'twelfth': 12, 'thirteenth': 13, 'fourteenth': 14,
            'fifteenth': 15, 'sixteenth': 16, 'seventeenth': 17, 'eighteenth': 18,
            'nineteenth': 19, 'twentieth': 20, 'twenty-first': 21, 'twenty-second': 22,
            'twenty-third': 23, 'twenty-fourth': 24, 'twenty-fifth': 25,
            'twenty-sixth': 26, 'twenty-seventh': 27, 'twenty-eighth': 28,
            'twenty-ninth': 29, 'thirtieth': 30, 'thirty-first': 31,
            'one': 1, 'two': 2, 'three': 3, 'four': 4, 'five': 5,
            'six': 6, 'seven': 7, 'eight': 8, 'nine': 9, 'ten': 10,
            'eleven': 11, 'twelve': 12, 'thirteen': 13, 'fourteen': 14,
            'fifteen': 15, 'sixteen': 16, 'seventeen': 17, 'eighteen': 18,
            'nineteen': 19, 'twenty': 20, 'thirty': 30
        }
        
        # Try to find month, day, year
        month = None
        day = None
        year = None
        
        # Find month
        for month_name, month_num in months.items():
            if month_name in text_lower:
                month = month_num
                break
        
        # Find year (look for "two thousand" patterns or years like 2021)
        year_match = re.search(r'two\s+thousand\s+(and\s+)?(\w+)?\s*(\w+)?', text_lower)
        if year_match:
            # Handle "two thousand and sixteen" or "two thousand sixteen"
            year_text = year_match.group(0)
            if 'sixteen' in year_text or 'sixteenth' in year_text:
                year = 2016
            elif 'seventeen' in year_text:
                year = 2017
            elif 'eighteen' in year_text:
                year = 2018
            elif 'nineteen' in year_text:
                year = 2019
            elif 'twenty' in year_text:
                year = 2020
            elif 'twenty one' in year_text or 'twenty-first' in year_text:
                year = 2021
            elif 'twenty two' in year_text or 'twenty second' in year_text:
                year = 2022
            elif 'twenty three' in year_text or 'twenty third' in year_text:
                year = 2023
            elif 'twenty four' in year_text or 'twenty fourth' in year_text:
                year = 2024
            elif 'twenty five' in year_text or 'twenty fifth' in year_text:
                year = 2025
        else:
            # Look for numeric years
            year_match = re.search(r'\b(19\d{2}|20\d{2})\b', text)
            if year_match:
                year = int(year_match.group(1))
        
        # Find day
        for day_word, day_num in number_words.items():
            if day_word in text_lower:
                day = day_num
                break
        
        # Try numeric day
        if not day:
            day_match = re.search(r'\b(\d{1,2})(?:st|nd|rd|th)?\b', text_lower)
            if day_match:
                day = int(day_match.group(1))
        
        # If we have all components, create a date
        if month and day and year:
            try:
                date_obj = datetime(year, month, day)
                return date_obj.strftime("%Y-%m-%d")
            except:
                pass
        
        # If parsing failed, return original text
        return text
    
    def extract_qa_pairs(self) -> Dict:
        """
        Extract question-answer pairs from the conversation turns.
        Uses predefined keys for each of the 5 questions.
        Converts last 3 keys to boolean values.
        
        Returns:
            Dictionary with predefined keys and user answers as values
        """
        if self.data is None:
            self.load_json()
        
        turns = self.data.get('turns', [])
        
        # Define the 5 keys in order
        question_keys = [
            "conviction_type",
            "date",
            "terms_of_service_completed",
            "other_convictions",
            "pending_charges_or_cases"
        ]
        
        # Keys that should be converted to boolean
        boolean_keys = ["terms_of_service_completed", "other_convictions", "pending_charges_or_cases"]
        
        qa_pairs = {}
        
        # Find first assistant message
        start_idx = 0
        for i, turn in enumerate(turns):
            if turn.get('role') == 'assistant':
                start_idx = i
                break
        
        # Now iterate through turns starting from first assistant message
        # Look for assistant-user pairs
        q_num = 0
        i = start_idx
        while i < len(turns) - 1 and q_num < len(question_keys):
            if turns[i].get('role') == 'assistant' and turns[i + 1].get('role') == 'user':
                answer = turns[i + 1].get('text', '').strip()
                current_key = question_keys[q_num]
                
                if answer:
                    # Convert based on key type
                    if current_key in boolean_keys:
                        # Convert to boolean if it's one of the last 3 keys
                        qa_pairs[current_key] = self.text_to_boolean(answer)
                    elif current_key == "date":
                        # Convert date to YYYY-MM-DD format
                        qa_pairs[current_key] = self.text_to_date(answer)
                    else:
                        # Keep as text for other fields
                        qa_pairs[current_key] = answer
                    q_num += 1
                i += 2  # Skip both assistant and user messages
            else:
                i += 1
        
        return qa_pairs
    
    def create_formatted_json(self, output_path: str = None) -> Dict:
        """
        Create a new JSON object with the formatted question-answer pairs.
        
        Args:
            output_path: Optional path to save the formatted JSON
        
        Returns:
            Dictionary with question-answer pairs (no wrapper)
        """
        qa_pairs = self.extract_qa_pairs()
        
        if output_path:
            output_file = Path(output_path)
            with open(output_file, 'w') as f:
                json.dump(qa_pairs, f, indent=2)
        
        return qa_pairs


# Example usage
if __name__ == "__main__":
    # Example: parse a conversation JSON file
    parser = ConversationParser("path/to/conversation.json")
    formatted_json = parser.create_formatted_json("path/to/output.json")
    print(json.dumps(formatted_json, indent=2))
