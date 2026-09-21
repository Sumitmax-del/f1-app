package com.f1app.dashboard;

import com.f1app.client.F1AgentClient;
import com.f1app.client.F1AgentResponse;

import javax.swing.*;
import javax.swing.border.EmptyBorder;
import java.awt.*;
import java.awt.event.KeyAdapter;
import java.awt.event.KeyEvent;
import java.util.List;

/**
 * Modern, responsive Java Swing AI Chat Panel designed to integrate seamlessly
 * into any Formula 1 Dashboard application.
 *
 * Features:
 * - Question input box with Enter key submission
 * - Ask button with dynamic loading state
 * - Rich formatted answer display area
 * - Sources and Tool badge display
 * - Indeterminate progress bar loading indicator
 * - Non-blocking asynchronous execution using F1AgentClient
 * - Dedicated error banner
 */
public class F1AiChatPanel extends JPanel {

    // Theme Colors
    private static final Color BG_DARK = new Color(15, 17, 23);
    private static final Color CARD_BG = new Color(24, 27, 36);
    private static final Color ACCENT_RED = new Color(225, 6, 0);       // Official F1 Red
    private static final Color ACCENT_RED_HOVER = new Color(255, 24, 18);
    private static final Color TEXT_WHITE = new Color(245, 245, 245);
    private static final Color TEXT_MUTED = new Color(150, 155, 170);
    private static final Color BORDER_COLOR = new Color(45, 50, 65);
    private static final Color ERROR_RED = new Color(220, 53, 69);
    private static final Color SUCCESS_GREEN = new Color(40, 167, 69);

    private final F1AgentClient agentClient;

    // UI Components
    private JTextField questionInput;
    private JButton askButton;
    private JTextArea answerArea;
    private JProgressBar loadingBar;
    private JLabel statusLabel;
    private JLabel errorLabel;
    private JPanel sourcesPanel;
    private JLabel toolBadge;

    public F1AiChatPanel() {
        this(new F1AgentClient());
    }

    public F1AiChatPanel(F1AgentClient agentClient) {
        this.agentClient = agentClient != null ? agentClient : new F1AgentClient();
        initUI();
    }

    private void initUI() {
        setLayout(new BorderLayout(0, 12));
        setBackground(CARD_BG);
        setBorder(BorderFactory.createCompoundBorder(
                BorderFactory.createLineBorder(BORDER_COLOR, 1, true),
                new EmptyBorder(16, 16, 16, 16)
        ));

        // ── 1. Header Section ──────────────────────────────────────────
        JPanel headerPanel = new JPanel(new BorderLayout());
        headerPanel.setOpaque(false);

        JLabel titleLabel = new JLabel("🏎️ F1 AI ASSISTANT & TELEMETRY COPILOT");
        titleLabel.setFont(new Font("SansSerif", Font.BOLD, 14));
        titleLabel.setForeground(TEXT_WHITE);

        toolBadge = new JLabel("READY");
        toolBadge.setFont(new Font("SansSerif", Font.BOLD, 10));
        toolBadge.setForeground(SUCCESS_GREEN);
        toolBadge.setBorder(BorderFactory.createCompoundBorder(
                BorderFactory.createLineBorder(SUCCESS_GREEN, 1, true),
                new EmptyBorder(2, 6, 2, 6)
        ));

        headerPanel.add(titleLabel, BorderLayout.WEST);
        headerPanel.add(toolBadge, BorderLayout.EAST);
        add(headerPanel, BorderLayout.NORTH);

        // ── 2. Center Content (Answer & Sources) ────────────────────────
        JPanel centerPanel = new JPanel(new BorderLayout(0, 8));
        centerPanel.setOpaque(false);

        // Answer Display Area
        answerArea = new JTextArea(8, 30);
        answerArea.setEditable(false);
        answerArea.setLineWrap(true);
        answerArea.setWrapStyleWord(true);
        answerArea.setBackground(BG_DARK);
        answerArea.setForeground(TEXT_WHITE);
        answerArea.setFont(new Font("SansSerif", Font.PLAIN, 13));
        answerArea.setMargin(new Insets(10, 10, 10, 10));
        answerArea.setText("Ask me anything about Formula 1:\n" +
                "• \"Who had the fastest lap at Mexico 2021?\"\n" +
                "• \"Who is leading the championship?\"\n" +
                "• \"What happened at Abu Dhabi 2021?\"\n" +
                "• \"What is DRS and how does it work?\"\n" +
                "• \"Why did I lose time in Sector 2?\"");

        JScrollPane scrollPane = new JScrollPane(answerArea);
        scrollPane.setBorder(BorderFactory.createLineBorder(BORDER_COLOR, 1));
        scrollPane.getViewport().setBackground(BG_DARK);
        centerPanel.add(scrollPane, BorderLayout.CENTER);

        // Sources Container
        sourcesPanel = new JPanel(new FlowLayout(FlowLayout.LEFT, 6, 4));
        sourcesPanel.setOpaque(false);
        sourcesPanel.setVisible(false);
        centerPanel.add(sourcesPanel, BorderLayout.SOUTH);

        add(centerPanel, BorderLayout.CENTER);

        // ── 3. Bottom Controls (Input, Button, Progress, Error) ─────────
        JPanel bottomPanel = new JPanel(new BorderLayout(0, 6));
        bottomPanel.setOpaque(false);

        // Error message banner
        errorLabel = new JLabel();
        errorLabel.setForeground(ERROR_RED);
        errorLabel.setFont(new Font("SansSerif", Font.BOLD, 12));
        errorLabel.setVisible(false);
        bottomPanel.add(errorLabel, BorderLayout.NORTH);

        // Input & Button Row
        JPanel inputRow = new JPanel(new BorderLayout(8, 0));
        inputRow.setOpaque(false);

        questionInput = new JTextField();
        questionInput.setBackground(BG_DARK);
        questionInput.setForeground(TEXT_WHITE);
        questionInput.setCaretColor(TEXT_WHITE);
        questionInput.setFont(new Font("SansSerif", Font.PLAIN, 13));
        questionInput.setBorder(BorderFactory.createCompoundBorder(
                BorderFactory.createLineBorder(BORDER_COLOR, 1, true),
                new EmptyBorder(8, 10, 8, 10)
        ));
        questionInput.addKeyListener(new KeyAdapter() {
            @Override
            public void keyPressed(KeyEvent e) {
                if (e.getKeyCode() == KeyEvent.VK_ENTER && askButton.isEnabled()) {
                    handleAskQuestion();
                }
            }
        });

        askButton = new JButton("Ask AI");
        askButton.setBackground(ACCENT_RED);
        askButton.setForeground(Color.WHITE);
        askButton.setFont(new Font("SansSerif", Font.BOLD, 13));
        askButton.setFocusPainted(false);
        askButton.setBorder(new EmptyBorder(8, 16, 8, 16));
        askButton.setCursor(new Cursor(Cursor.HAND_CURSOR));
        askButton.addActionListener(e -> handleAskQuestion());

        inputRow.add(questionInput, BorderLayout.CENTER);
        inputRow.add(askButton, BorderLayout.EAST);
        bottomPanel.add(inputRow, BorderLayout.CENTER);

        // Loading Progress Bar & Status Text
        JPanel statusRow = new JPanel(new BorderLayout(6, 0));
        statusRow.setOpaque(false);

        loadingBar = new JProgressBar();
        loadingBar.setIndeterminate(true);
        loadingBar.setForeground(ACCENT_RED);
        loadingBar.setBackground(BG_DARK);
        loadingBar.setPreferredSize(new Dimension(loadingBar.getPreferredSize().width, 4));
        loadingBar.setBorder(null);
        loadingBar.setVisible(false);

        statusLabel = new JLabel(" ");
        statusLabel.setForeground(TEXT_MUTED);
        statusLabel.setFont(new Font("SansSerif", Font.ITALIC, 11));

        statusRow.add(loadingBar, BorderLayout.NORTH);
        statusRow.add(statusLabel, BorderLayout.SOUTH);
        bottomPanel.add(statusRow, BorderLayout.SOUTH);

        add(bottomPanel, BorderLayout.SOUTH);
    }

    /**
     * Handles the question submission asynchronously without freezing the Java UI.
     */
    private void handleAskQuestion() {
        String question = questionInput.getText().trim();
        if (question.isEmpty()) {
            return;
        }

        // Update UI to loading state
        setLoadingState(true, "Consulting F1 AI Agent & Retrieving Telemetry...");
        hideError();
        clearSources();

        // Perform non-blocking asynchronous HTTP POST to Python server
        agentClient.askAsync(question)
                .thenAccept(response -> {
                    // Update Swing components safely on the Event Dispatch Thread
                    SwingUtilities.invokeLater(() -> displayResponse(response));
                })
                .exceptionally(throwable -> {
                    SwingUtilities.invokeLater(() -> {
                        setLoadingState(false, "Error");
                        showError("Unexpected error: " + throwable.getMessage());
                    });
                    return null;
                });
    }

    private void displayResponse(F1AgentResponse response) {
        setLoadingState(false, "Done");

        if (response.isSuccess()) {
            answerArea.setText(response.getAnswer());
            updateToolBadge(response.getToolUsed());
            updateSources(response.getSources());
            hideError();
        } else {
            showError(response.getErrorMessage());
            toolBadge.setText("ERROR");
            toolBadge.setForeground(ERROR_RED);
            toolBadge.setBorder(BorderFactory.createCompoundBorder(
                    BorderFactory.createLineBorder(ERROR_RED, 1, true),
                    new EmptyBorder(2, 6, 2, 6)
            ));
        }
    }

    private void updateToolBadge(List<String> tools) {
        if (tools == null || tools.isEmpty()) {
            toolBadge.setText("LLM DIRECT");
            toolBadge.setForeground(TEXT_MUTED);
        } else {
            String label = String.join(" + ", tools).toUpperCase();
            toolBadge.setText("TOOL: " + label);
            toolBadge.setForeground(SUCCESS_GREEN);
        }
        toolBadge.setBorder(BorderFactory.createCompoundBorder(
                BorderFactory.createLineBorder(toolBadge.getForeground(), 1, true),
                new EmptyBorder(2, 6, 2, 6)
        ));
    }

    private void updateSources(List<String> sources) {
        sourcesPanel.removeAll();
        if (sources != null && !sources.isEmpty()) {
            JLabel header = new JLabel("Sources: ");
            header.setFont(new Font("SansSerif", Font.BOLD, 11));
            header.setForeground(TEXT_MUTED);
            sourcesPanel.add(header);

            for (String src : sources) {
                JLabel badge = new JLabel(src);
                badge.setFont(new Font("SansSerif", Font.PLAIN, 10));
                badge.setForeground(TEXT_WHITE);
                badge.setBackground(BG_DARK);
                badge.setOpaque(true);
                badge.setBorder(BorderFactory.createCompoundBorder(
                        BorderFactory.createLineBorder(BORDER_COLOR, 1, true),
                        new EmptyBorder(2, 6, 2, 6)
                ));
                sourcesPanel.add(badge);
            }
            sourcesPanel.setVisible(true);
        } else {
            sourcesPanel.setVisible(false);
        }
        sourcesPanel.revalidate();
        sourcesPanel.repaint();
    }

    private void clearSources() {
        sourcesPanel.removeAll();
        sourcesPanel.setVisible(false);
        sourcesPanel.revalidate();
        sourcesPanel.repaint();
    }

    private void setLoadingState(boolean loading, String statusText) {
        askButton.setEnabled(!loading);
        questionInput.setEnabled(!loading);
        loadingBar.setVisible(loading);
        statusLabel.setText(statusText);
        if (loading) {
            toolBadge.setText("PROCESSING...");
            toolBadge.setForeground(new Color(255, 193, 7)); // Yellow
            toolBadge.setBorder(BorderFactory.createCompoundBorder(
                    BorderFactory.createLineBorder(toolBadge.getForeground(), 1, true),
                    new EmptyBorder(2, 6, 2, 6)
            ));
        }
    }

    private void showError(String msg) {
        errorLabel.setText("⚠️ " + msg);
        errorLabel.setVisible(true);
    }

    private void hideError() {
        errorLabel.setText("");
        errorLabel.setVisible(false);
    }

    public JTextField getQuestionInputField() {
        return questionInput;
    }

    public JButton getAskButton() {
        return askButton;
    }

    public JTextArea getAnswerArea() {
        return answerArea;
    }
}
