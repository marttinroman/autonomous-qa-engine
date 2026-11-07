import { expect, test } from '@fixtures/TestFixture';

test.describe('Layer 1: AI Semantic Evaluation Console Flow', () => {
  test('AQE-206: should submit query to RAG assistant and display generated answer with retrieved context', async ({
    ui,
  }) => {
    const { answer, context } = await ui.aiChat.queryAssistantSuccessfully(
      'What are the core validation layers of the Autonomous QA Engine?',
    );

    expect(answer).toContain('Layer 1 (Web UI)');
    expect(context).toContain('Autonomous QA Engine Architecture');
  });

  test('AQE-207: should execute semantic evaluation check and assert passing score thresholds', async ({
    ui,
  }) => {
    await ui.aiChat.queryAssistantSuccessfully();
    await ui.aiChat.executeSemanticEvaluation();
  });
});
