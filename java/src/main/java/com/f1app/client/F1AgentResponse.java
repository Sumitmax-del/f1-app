package com.f1app.client;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

/**
 * Encapsulates the structured response returned by the Python F1 AI Agent (/ask endpoint).
 */
public class F1AgentResponse {

    private final String question;
    private final String answer;
    private final List<String> toolUsed;
    private final List<String> sources;
    private final String confidence;
    private final boolean success;
    private final String errorMessage;

    public F1AgentResponse(
            String question,
            String answer,
            List<String> toolUsed,
            List<String> sources,
            String confidence,
            boolean success,
            String errorMessage
    ) {
        this.question = question != null ? question : "";
        this.answer = answer != null ? answer : "";
        this.toolUsed = toolUsed != null ? Collections.unmodifiableList(new ArrayList<>(toolUsed)) : Collections.emptyList();
        this.sources = sources != null ? Collections.unmodifiableList(new ArrayList<>(sources)) : Collections.emptyList();
        this.confidence = confidence != null ? confidence : "high";
        this.success = success;
        this.errorMessage = errorMessage != null ? errorMessage : "";
    }

    public static F1AgentResponse success(String question, String answer, List<String> toolUsed, List<String> sources, String confidence) {
        return new F1AgentResponse(question, answer, toolUsed, sources, confidence, true, null);
    }

    public static F1AgentResponse failure(String question, String errorMessage) {
        return new F1AgentResponse(question, "", Collections.emptyList(), Collections.emptyList(), "low", false, errorMessage);
    }

    public String getQuestion() {
        return question;
    }

    public String getAnswer() {
        return answer;
    }

    public List<String> getToolUsed() {
        return toolUsed;
    }

    public List<String> getSources() {
        return sources;
    }

    public String getConfidence() {
        return confidence;
    }

    public boolean isSuccess() {
        return success;
    }

    public String getErrorMessage() {
        return errorMessage;
    }

    @Override
    public String toString() {
        return "F1AgentResponse{" +
                "success=" + success +
                ", toolUsed=" + toolUsed +
                ", sources=" + sources.size() +
                ", answer='" + (answer.length() > 60 ? answer.substring(0, 60) + "..." : answer) + '\'' +
                '}';
    }
}
