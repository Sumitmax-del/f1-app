package com.f1app.dashboard;

import com.f1app.client.F1AgentClient;

import javax.swing.*;
import javax.swing.border.EmptyBorder;
import java.awt.*;

/**
 * Demonstrates the full Java F1 Live Dashboard with the integrated F1 AI Agent Copilot.
 */
public class F1DashboardApp {

    private static final Color BG_MAIN = new Color(11, 13, 17);
    private static final Color CARD_BG = new Color(20, 23, 31);
    private static final Color ACCENT_RED = new Color(225, 6, 0);
    private static final Color TEXT_WHITE = new Color(245, 245, 245);
    private static final Color TEXT_MUTED = new Color(140, 145, 160);
    private static final Color BORDER_COLOR = new Color(40, 45, 58);

    public static void main(String[] args) {
        // Set cross-platform look and feel
        try {
            UIManager.setLookAndFeel(UIManager.getSystemLookAndFeelClassName());
        } catch (Exception ignored) {}

        SwingUtilities.invokeLater(F1DashboardApp::createAndShowGUI);
    }

    private static void createAndShowGUI() {
        JFrame frame = new JFrame("🏎️ Formula 1 Live Dashboard & AI Telemetry Copilot");
        frame.setDefaultCloseOperation(JFrame.EXIT_ON_CLOSE);
        frame.setSize(1100, 750);
        frame.setLocationRelativeTo(null);
        frame.getContentPane().setBackground(BG_MAIN);
        frame.setLayout(new BorderLayout(16, 16));

        // ── Top Navigation Bar ──────────────────────────────────────────
        JPanel topBar = new JPanel(new BorderLayout());
        topBar.setBackground(CARD_BG);
        topBar.setBorder(BorderFactory.createCompoundBorder(
                BorderFactory.createMatteBorder(0, 0, 1, 0, BORDER_COLOR),
                new EmptyBorder(12, 20, 12, 20)
        ));

        JLabel logoLabel = new JLabel("🏎️ F1 LIVE TELEMETRY DASHBOARD");
        logoLabel.setFont(new Font("SansSerif", Font.BOLD, 16));
        logoLabel.setForeground(ACCENT_RED);

        JLabel liveIndicator = new JLabel("● LIVE SESSION: MONACO GP");
        liveIndicator.setFont(new Font("SansSerif", Font.BOLD, 12));
        liveIndicator.setForeground(new Color(40, 167, 69));

        topBar.add(logoLabel, BorderLayout.WEST);
        topBar.add(liveIndicator, BorderLayout.EAST);
        frame.add(topBar, BorderLayout.NORTH);

        // ── Main Content Split (Dashboard Left, AI Copilot Right) ────────
        JPanel mainContent = new JPanel(new GridLayout(1, 2, 16, 0));
        mainContent.setOpaque(false);
        mainContent.setBorder(new EmptyBorder(0, 16, 16, 16));

        // Left Panel: Simulated Telemetry & Leaderboard Cards
        JPanel leftPanel = new JPanel(new BorderLayout(0, 12));
        leftPanel.setOpaque(false);

        JPanel telemetryCard = createTelemetryCard();
        JPanel leaderboardCard = createLeaderboardCard();
        leftPanel.add(telemetryCard, BorderLayout.NORTH);
        leftPanel.add(leaderboardCard, BorderLayout.CENTER);

        // Right Panel: AI Chat Panel
        F1AgentClient client = new F1AgentClient("http://localhost:8000/ask");
        F1AiChatPanel aiChatPanel = new F1AiChatPanel(client);

        mainContent.add(leftPanel);
        mainContent.add(aiChatPanel);
        frame.add(mainContent, BorderLayout.CENTER);

        frame.setVisible(true);
    }

    private static JPanel createTelemetryCard() {
        JPanel panel = new JPanel(new GridLayout(2, 3, 10, 10));
        panel.setBackground(CARD_BG);
        panel.setBorder(BorderFactory.createCompoundBorder(
                BorderFactory.createLineBorder(BORDER_COLOR, 1, true),
                new EmptyBorder(14, 14, 14, 14)
        ));

        panel.add(createMetric("SPEED", "318 km/h", ACCENT_RED));
        panel.add(createMetric("THROTTLE", "100%", new Color(40, 167, 69)));
        panel.add(createMetric("BRAKE", "0 bar", TEXT_MUTED));
        panel.add(createMetric("GEAR", "7th", TEXT_WHITE));
        panel.add(createMetric("DRS", "ENABLED", new Color(0, 123, 255)));
        panel.add(createMetric("TYRE TEMP", "101°C", new Color(255, 193, 7)));

        return panel;
    }

    private static JPanel createMetric(String title, String val, Color valColor) {
        JPanel p = new JPanel(new BorderLayout(0, 4));
        p.setBackground(BG_MAIN);
        p.setBorder(new EmptyBorder(8, 10, 8, 10));

        JLabel t = new JLabel(title);
        t.setFont(new Font("SansSerif", Font.PLAIN, 10));
        t.setForeground(TEXT_MUTED);

        JLabel v = new JLabel(val);
        v.setFont(new Font("SansSerif", Font.BOLD, 14));
        v.setForeground(valColor);

        p.add(t, BorderLayout.NORTH);
        p.add(v, BorderLayout.CENTER);
        return p;
    }

    private static JPanel createLeaderboardCard() {
        JPanel panel = new JPanel(new BorderLayout());
        panel.setBackground(CARD_BG);
        panel.setBorder(BorderFactory.createCompoundBorder(
                BorderFactory.createLineBorder(BORDER_COLOR, 1, true),
                new EmptyBorder(14, 14, 14, 14)
        ));

        JLabel title = new JLabel("CURRENT STANDINGS & LIVE TIMING");
        title.setFont(new Font("SansSerif", Font.BOLD, 12));
        title.setForeground(TEXT_WHITE);
        panel.add(title, BorderLayout.NORTH);

        String[] columnNames = {"Pos", "Driver", "Team", "Gap", "Tyre"};
        Object[][] data = {
                {"P1", "Max Verstappen", "Red Bull", "LEADER", "Soft (L12)"},
                {"P2", "Lando Norris", "McLaren", "+1.284s", "Medium (L12)"},
                {"P3", "Charles Leclerc", "Ferrari", "+3.840s", "Hard (L12)"},
                {"P4", "Lewis Hamilton", "Mercedes", "+6.190s", "Medium (L12)"},
                {"P5", "Oscar Piastri", "McLaren", "+7.450s", "Soft (L12)"},
        };

        JTable table = new JTable(data, columnNames);
        table.setBackground(BG_MAIN);
        table.setForeground(TEXT_WHITE);
        table.setGridColor(BORDER_COLOR);
        table.setRowHeight(28);
        table.getTableHeader().setBackground(CARD_BG);
        table.getTableHeader().setForeground(TEXT_MUTED);

        JScrollPane sp = new JScrollPane(table);
        sp.setBorder(BorderFactory.createLineBorder(BORDER_COLOR, 1));
        sp.getViewport().setBackground(BG_MAIN);
        panel.add(sp, BorderLayout.CENTER);

        return panel;
    }
}
