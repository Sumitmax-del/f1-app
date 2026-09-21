package com.f1app.client;

import java.io.BufferedReader;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.io.OutputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.CompletableFuture;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * Universal, non-blocking Java HTTP Client for communicating with the
 * Python FastAPI F1 AI Agent (/ask endpoint).
 *
 * Compatible with all Java versions (Java 8 through 23+) with zero external dependencies.
 * Uses CompletableFuture for non-blocking asynchronous execution so the Java UI never freezes.
 */
public class F1AgentClient {

    private static final String DEFAULT_SERVER_URL = "http://localhost:8000/ask";
    private static final int DEFAULT_CONNECT_TIMEOUT_MS = 10_000;
    private static final int DEFAULT_READ_TIMEOUT_MS = 35_000;

    private final String serverUrl;
    private final int connectTimeoutMs;
    private final int readTimeoutMs;

    public F1AgentClient() {
        this(DEFAULT_SERVER_URL, DEFAULT_CONNECT_TIMEOUT_MS, DEFAULT_READ_TIMEOUT_MS);
    }

    public F1AgentClient(String serverUrl) {
        this(serverUrl, DEFAULT_CONNECT_TIMEOUT_MS, DEFAULT_READ_TIMEOUT_MS);
    }

    public F1AgentClient(String serverUrl, int connectTimeoutMs, int readTimeoutMs) {
        this.serverUrl = serverUrl != null ? serverUrl : DEFAULT_SERVER_URL;
        this.connectTimeoutMs = connectTimeoutMs;
        this.readTimeoutMs = readTimeoutMs;
    }

    /**
     * Sends an asynchronous question to the Python F1 AI Agent.
     * Does NOT block the calling thread or the Java dashboard UI.
     *
     * @param question The Formula 1 question to ask.
     * @return CompletableFuture containing the structured F1AgentResponse.
     */
    public CompletableFuture<F1AgentResponse> askAsync(String question) {
        if (question == null || question.trim().isEmpty()) {
            return CompletableFuture.completedFuture(
                    F1AgentResponse.failure(question, "Question cannot be empty.")
            );
        }

        return CompletableFuture.supplyAsync(() -> executeHttpRequest(question));
    }

    /**
     * Synchronous blocking convenience method (calls askAsync().join()).
     *
     * @param question The Formula 1 question to ask.
     * @return Structured F1AgentResponse.
     */
    public F1AgentResponse ask(String question) {
        return askAsync(question).join();
    }

    /**
     * Executes the HTTP POST request to the Python server.
     */
    private F1AgentResponse executeHttpRequest(String question) {
        HttpURLConnection conn = null;
        try {
            URL url = new URL(this.serverUrl);
            conn = (HttpURLConnection) url.openConnection();
            conn.setRequestMethod("POST");
            conn.setConnectTimeout(this.connectTimeoutMs);
            conn.setReadTimeout(this.readTimeoutMs);
            conn.setRequestProperty("Content-Type", "application/json; charset=UTF-8");
            conn.setRequestProperty("Accept", "application/json");
            conn.setDoOutput(true);
            conn.setDoInput(true);

            String jsonPayload = buildJsonPayload(question);
            byte[] outputBytes = jsonPayload.getBytes(StandardCharsets.UTF_8);

            try (OutputStream os = conn.getOutputStream()) {
                os.write(outputBytes);
                os.flush();
            }

            int statusCode = conn.getResponseCode();
            InputStream is = (statusCode >= 200 && statusCode < 300)
                    ? conn.getInputStream()
                    : conn.getErrorStream();

            String responseBody = readStream(is);

            if (statusCode >= 200 && statusCode < 300) {
                return parseJsonResponse(question, responseBody);
            } else {
                return F1AgentResponse.failure(
                        question,
                        "Python server returned HTTP " + statusCode + ": " + responseBody
                );
            }

        } catch (java.net.ConnectException ce) {
            return F1AgentResponse.failure(
                    question,
                    "Could not connect to Python AI Agent at " + this.serverUrl +
                    ". Please ensure 'python main.py' is running on port 8000."
            );
        } catch (java.net.SocketTimeoutException ste) {
            return F1AgentResponse.failure(
                    question,
                    "AI Agent request timed out after " + (this.readTimeoutMs / 1000) + " seconds."
            );
        } catch (Exception e) {
            return F1AgentResponse.failure(
                    question,
                    "HTTP Communication Error: " + (e.getMessage() != null ? e.getMessage() : e.getClass().getSimpleName())
            );
        } finally {
            if (conn != null) {
                conn.disconnect();
            }
        }
    }

    private String readStream(InputStream is) throws Exception {
        if (is == null) return "";
        StringBuilder sb = new StringBuilder();
        try (BufferedReader reader = new BufferedReader(new InputStreamReader(is, StandardCharsets.UTF_8))) {
            String line;
            while ((line = reader.readLine()) != null) {
                sb.append(line).append("\n");
            }
        }
        return sb.toString().trim();
    }

    /**
     * Lightweight, robust zero-dependency JSON parser for Python agent responses.
     */
    private F1AgentResponse parseJsonResponse(String question, String json) {
        String answer = extractJsonStringField(json, "answer");
        if (answer.isEmpty()) {
            answer = extractJsonStringField(json, "reply");
        }
        if (answer.isEmpty()) {
            answer = extractJsonStringField(json, "response");
        }

        List<String> toolUsed = extractJsonStringArray(json, "tool_used");
        List<String> sources = extractJsonStringArray(json, "sources");
        String confidence = extractJsonStringField(json, "confidence");
        if (confidence.isEmpty()) {
            confidence = "high";
        }

        return F1AgentResponse.success(question, answer, toolUsed, sources, confidence);
    }

    private String buildJsonPayload(String question) {
        String escaped = escapeJson(question);
        return "{\"question\":\"" + escaped + "\"}";
    }

    private String escapeJson(String raw) {
        if (raw == null) return "";
        return raw.replace("\\", "\\\\")
                  .replace("\"", "\\\"")
                  .replace("\b", "\\b")
                  .replace("\f", "\\f")
                  .replace("\n", "\\n")
                  .replace("\r", "\\r")
                  .replace("\t", "\\t");
    }

    private String unescapeJson(String text) {
        if (text == null) return "";
        return text.replace("\\n", "\n")
                   .replace("\\r", "\r")
                   .replace("\\t", "\t")
                   .replace("\\\"", "\"")
                   .replace("\\\\", "\\");
    }

    private String extractJsonStringField(String json, String fieldName) {
        Pattern pattern = Pattern.compile("\"" + Pattern.quote(fieldName) + "\"\\s*:\\s*\"((?:\\\\.|[^\"\\\\])*)\"");
        Matcher matcher = pattern.matcher(json);
        if (matcher.find()) {
            return unescapeJson(matcher.group(1));
        }
        return "";
    }

    private List<String> extractJsonStringArray(String json, String fieldName) {
        List<String> list = new ArrayList<>();
        Pattern arrayPattern = Pattern.compile("\"" + Pattern.quote(fieldName) + "\"\\s*:\\s*\\[([^\\]]*)\\]");
        Matcher arrayMatcher = arrayPattern.matcher(json);
        if (arrayMatcher.find()) {
            String elements = arrayMatcher.group(1);
            Pattern itemPattern = Pattern.compile("\"((?:\\\\.|[^\"\\\\])*)\"");
            Matcher itemMatcher = itemPattern.matcher(elements);
            while (itemMatcher.find()) {
                list.add(unescapeJson(itemMatcher.group(1)));
            }
        } else {
            String singleVal = extractJsonStringField(json, fieldName);
            if (!singleVal.isEmpty()) {
                list.add(singleVal);
            }
        }
        return list;
    }

    public String getServerUrl() {
        return serverUrl;
    }
}
