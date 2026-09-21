package com.f1app.client;

import java.util.concurrent.CompletableFuture;

/**
 * Verification test for the Java HTTP Client connecting to the Python AI Agent.
 */
public class F1AgentClientTest {

    public static void main(String[] args) {
        System.out.println("=================================================");
        System.out.println("   JAVA -> PYTHON F1 AI AGENT INTEGRATION TEST   ");
        System.out.println("=================================================");

        String serverUrl = args.length > 0 ? args[0] : "http://localhost:8000/ask";
        F1AgentClient client = new F1AgentClient(serverUrl);

        String[] testQuestions = {
                "Who had the fastest lap at the 2021 Mexican GP?",
                "What is DRS?",
                "How does the points system work?",
                "Why did I lose time in Sector 2?",
                "What happened at Abu Dhabi 2021?"
        };

        for (String q : testQuestions) {
            System.out.println("\n[JAVA CLIENT] Sending Question: \"" + q + "\"");
            
            // Test asynchronous execution
            CompletableFuture<F1AgentResponse> future = client.askAsync(q);
            
            try {
                F1AgentResponse response = future.join();
                System.out.println("[JAVA CLIENT] Success      : " + response.isSuccess());
                System.out.println("[JAVA CLIENT] Tool Used    : " + response.getToolUsed());
                System.out.println("[JAVA CLIENT] Sources Count: " + response.getSources().size());
                if (!response.getSources().isEmpty()) {
                    System.out.println("[JAVA CLIENT] First Source : " + response.getSources().get(0));
                }
                String preview = response.getAnswer().replace("\n", " ");
                if (preview.length() > 100) {
                    preview = preview.substring(0, 100) + "...";
                }
                System.out.println("[JAVA CLIENT] Answer       : " + preview);
            } catch (Exception e) {
                System.err.println("[JAVA CLIENT] Error: " + e.getMessage());
            }
        }

        System.out.println("\n=================================================");
        System.out.println("   JAVA CLIENT TEST EXECUTION FINISHED           ");
        System.out.println("=================================================");
    }
}
