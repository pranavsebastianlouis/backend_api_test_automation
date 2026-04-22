import { allure } from 'allure-playwright';

export type AllureMeta = {
  epicId: string;
  epicName: string;
  storyId: string;
  storyName: string;
  testCaseId: string;
  scenarioId?: string;
};

/**
 * Allure grouping strategy:
 * - parentSuite: Epic (ID + name)
 * - suite: Story (ID + name)
 * - epic/story labels: also set so "Behaviors" view can be used
 * - labels: testcase/scenario for traceability
 */
export function applyAllureMeta(meta: AllureMeta) {
  const epic = `${meta.epicId} ${meta.epicName}`.trim();
  const story = `${meta.storyId} ${meta.storyName}`.trim();

  allure.parentSuite(epic);
  allure.suite(story);

  allure.epic(epic);
  allure.story(story);

  allure.label('testcase', meta.testCaseId);
  if (meta.scenarioId) allure.label('scenario', meta.scenarioId);
}

