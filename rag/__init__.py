"""
RAG (Retrieval Augmented Generation) Module for Expungement Eligibility
Contains vector store setup and LangChain RAG service
"""

from .rag_service import check_eligibility, get_pathway_to_eligibility

__all__ = ['check_eligibility', 'get_pathway_to_eligibility']

