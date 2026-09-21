"""
Test suite for Hugging Face LLM integration and /ask endpoint.
Tests at least 3 F1 questions.
"""

import os
import unittest
from unittest.mock import patch, MagicMock
from fastapi.testclient import TestClient

# Import FastAPI apps
from main import app as root_app
from app.llm.huggingface import generate_response, format_prompt, get_model_name


class TestHuggingFaceLLM(unittest.TestCase):

    def setUp(self):
        self.client = TestClient(root_app)
        self.test_questions = [
            "Explain what DRS is in Formula 1.",
            "What is the difference between soft, medium, and hard tyre compounds?",
            "How does the Formula 1 championship points system work for top 10 finishers?",
        ]

    def test_format_prompt(self):
        """Test prompt formatting with and without context."""
        prompt_only = format_prompt("What is DRS?")
        self.assertEqual(prompt_only, "What is DRS?")

        with_context = format_prompt("What is DRS?", context="DRS stands for Drag Reduction System.")
        self.assertIn("Context:", with_context)
        self.assertIn("Question:", with_context)

    def test_unconfigured_hf_api_key(self):
        """Test graceful message when HF_API_KEY is not configured."""
        with patch.dict(os.environ, {"HF_API_KEY": ""}):
            for q in self.test_questions:
                response = self.client.post("/ask", json={"question": q})
                self.assertEqual(response.status_code, 200)
                data = response.json()
                self.assertEqual(data["question"], q)
                self.assertIn("Hugging Face API Key is not configured", data["answer"])

    def test_mocked_hf_llm_responses(self):
        """Test the /ask endpoint with 3 realistic F1 questions."""
        mock_answers = {
            "Explain what DRS is in Formula 1.": (
                "DRS (Drag Reduction System) is a driver-controlled device in Formula 1 designed to promote overtaking. "
                "When activated within 1 second of a leading car in designated DRS zones, an adjustable flap on the rear wing opens, "
                "significantly reducing aerodynamic drag and increasing top speed by approximately 10-12 km/h."
            ),
            "What is the difference between soft, medium, and hard tyre compounds?": (
                "Pirelli supplies three slick tyre compounds for each Grand Prix: Soft (red), Medium (yellow), and Hard (white). "
                "Soft tyres provide the highest mechanical grip and fastest lap times but degrade rapidly. "
                "Hard tyres offer maximum durability and long stint life with lower peak grip. "
                "Medium tyres balance grip and lifespan for flexible race strategies."
            ),
            "How does the Formula 1 championship points system work for top 10 finishers?": (
                "Formula 1 awards World Championship points to the top 10 classified finishers in a Grand Prix: "
                "1st: 25 pts, 2nd: 18 pts, 3rd: 15 pts, 4th: 12 pts, 5th: 10 pts, "
                "6th: 8 pts, 7th: 6 pts, 8th: 4 pts, 9th: 2 pts, 10th: 1 pt. "
                "An additional 1 bonus point was historically awarded for the fastest lap if finished in the top 10."
            ),
        }

        for question, expected_answer in mock_answers.items():
            with patch("app.agent.generate_response", return_value=expected_answer), \
                 patch("app.llm.huggingface.generate_response", return_value=expected_answer):
                resp = self.client.post("/ask", json={"question": question})
                self.assertEqual(resp.status_code, 200)
                body = resp.json()
                self.assertEqual(body["question"], question)
                self.assertEqual(body["answer"], expected_answer)
                self.assertEqual(body["model"], get_model_name())
                print(f"\n[TEST PASS] Question: {question}")
                print(f"[TEST PASS] Answer snippet: {body['answer'][:80]}...\n")

    def test_direct_generate_response_mocked(self):
        """Test generate_response function with mocked InferenceClient."""
        with patch.dict(os.environ, {"HF_API_KEY": "hf_test_token_12345", "MODEL_NAME": "HuggingFaceH4/zephyr-7b-beta"}):
            with patch("huggingface_hub.InferenceClient") as mock_client_cls:
                mock_instance = MagicMock()
                mock_choice = MagicMock()
                mock_choice.message.content = "DRS reduces aerodynamic drag on straights."
                mock_instance.chat_completion.return_value.choices = [mock_choice]
                mock_client_cls.return_value = mock_instance

                result = generate_response("Explain DRS")
                self.assertEqual(result, "DRS reduces aerodynamic drag on straights.")
                print(f"[TEST PASS] generate_response with mock InferenceClient: {result}")


if __name__ == "__main__":
    unittest.main()
