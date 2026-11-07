import { expect } from '@playwright/test';
import { UiBase } from '@ui/UiBase';
import { atc } from '@utils/decorators';

export interface SemanticQueryOutput {
  answer: string
  context: string
}

/**
 * Layer 3: AI Semantic Evaluation Console Page Object Component
 *
 * Encapsulates interactive RAG queries, prompt interactions, and real-time semantic scoring ATCs.
 */
export class AIChatPage extends UiBase {
  @atc('AQE-206', { severity: 'critical' })
  async queryAssistantSuccessfully(prompt?: string): Promise<SemanticQueryOutput> {
    const queryPrompt
      = prompt ?? 'What are the core validation layers of the Autonomous QA Engine?';

    await this.goto('/ai-testing');

    const promptInput = this.getByTestId('prompt-input');
    await promptInput.fill(queryPrompt);

    await this.getByTestId('submit-prompt').click();

    const answerBox = this.getByTestId('ai-answer');
    await expect(answerBox).toBeVisible();
    await expect(answerBox).not.toBeEmpty();

    const contextBox = this.getByTestId('context-source');
    await expect(contextBox).toBeVisible();

    const answer = (await answerBox.textContent()) ?? '';
    const context = (await contextBox.textContent()) ?? '';

    return { answer, context };
  }

  @atc('AQE-207', { severity: 'normal' })
  async executeSemanticEvaluation(): Promise<void> {
    const evalButton = this.getByTestId('evaluate-semantic-btn');
    await expect(evalButton).toBeVisible();
    await evalButton.click();

    const metricsPanel = this.getByTestId('eval-metrics-panel');
    await expect(metricsPanel).toBeVisible();

    const simScore = this.getByTestId('similarity-score');
    await expect(simScore).toBeVisible();
    await expect(simScore).toContainText(/Cosine Similarity: 0\.[89]/);

    const faithScore = this.getByTestId('faithfulness-score');
    await expect(faithScore).toBeVisible();
    await expect(faithScore).toContainText(/Context Faithfulness: 0\.[89]/);

    const badge = this.getByTestId('semantic-eval-badge');
    await expect(badge).toBeVisible();
    await expect(badge).toContainText(/PASSED/);
  }

  async navigateBackToDashboard(): Promise<void> {
    await this.getByTestId('nav-dashboard').click();
    await this.assertUrl(/.*dashboard/);
  }
}
