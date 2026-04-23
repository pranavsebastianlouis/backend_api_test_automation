import { allure } from 'allure-playwright';
import { LabelName, Severity } from 'allure-js-commons';

export type AllureMeta = {
  epicId: string;
  epicName: string;
  storyId: string;
  storyName: string;
  testCaseId: string;
  scenarioId?: string;
};

type ServiceName = 'auth-api' | 'airlines-api' | 'cruises-api' | 'api-tests';

function serviceFromTestCaseId(testCaseId: string): ServiceName {
  if (testCaseId.startsWith('TC-HARNESS-') || testCaseId.startsWith('TC-FW-')) return 'api-tests';
  if (testCaseId.startsWith('TC-AUTH-')) return 'auth-api';
  if (testCaseId.startsWith('TC-AIR-')) return 'airlines-api';
  return 'cruises-api';
}

function inferSeverity(testCaseId: string): Severity {
  // Defect-focused defaults: prioritize customer-impacting flows + authz/security signals.
  // Keep conservative: validation-only checks are usually MINOR unless they gate core journeys.
  const rules: Array<{ re: RegExp; severity: Severity }> = [
    { re: /^TC-(HARNESS|FW)-/i, severity: Severity.TRIVIAL },

    // Auth — security / account integrity
    { re: /^TC-AUTH-00[23]$/i, severity: Severity.CRITICAL }, // register happy + duplicate email
    { re: /^TC-AUTH-00[4-7]$/i, severity: Severity.MINOR }, // pydantic validation
    { re: /^TC-AUTH-00[89]$/i, severity: Severity.BLOCKER }, // login happy path + wrong password
    { re: /^TC-AUTH-01[01]$/i, severity: Severity.CRITICAL }, // missing user + empty creds ambiguity
    { re: /^TC-AUTH-01[234]$/i, severity: Severity.CRITICAL }, // token boundaries
    { re: /^TC-AUTH-01[56]$/i, severity: Severity.CRITICAL }, // profile mutations / authz on profile

    // Airlines — booking + inventory sensitive paths
    { re: /^TC-AIR-001$/i, severity: Severity.TRIVIAL },
    { re: /^TC-AIR-002$/i, severity: Severity.NORMAL },
    { re: /^TC-AIR-00[3-5]$/i, severity: Severity.MINOR },
    { re: /^TC-AIR-006$/i, severity: Severity.NORMAL },
    { re: /^TC-AIR-007$/i, severity: Severity.MINOR },
    { re: /^TC-AIR-008$/i, severity: Severity.MINOR },
    { re: /^TC-AIR-009$/i, severity: Severity.MINOR },
    { re: /^TC-AIR-010$/i, severity: Severity.MINOR },
    { re: /^TC-AIR-011$/i, severity: Severity.MINOR },
    { re: /^TC-AIR-01[2-9]$/i, severity: Severity.CRITICAL }, // bookings lifecycle + invalid booking inputs
    { re: /^TC-AIR-020$/i, severity: Severity.NORMAL },
    { re: /^TC-AIR-021$/i, severity: Severity.NORMAL },

    // Cruises — mirror airlines priorities
    { re: /^TC-CRU-001$/i, severity: Severity.TRIVIAL },
    { re: /^TC-CRU-002$/i, severity: Severity.NORMAL },
    { re: /^TC-CRU-00[3-5]$/i, severity: Severity.MINOR },
    { re: /^TC-CRU-006$/i, severity: Severity.NORMAL },
    { re: /^TC-CRU-007$/i, severity: Severity.NORMAL },
    { re: /^TC-CRU-008$/i, severity: Severity.MINOR },
    { re: /^TC-CRU-009$/i, severity: Severity.MINOR },
    { re: /^TC-CRU-01[0-9]$/i, severity: Severity.CRITICAL }, // bookings lifecycle + invalid booking inputs
    { re: /^TC-CRU-018$/i, severity: Severity.NORMAL },
    { re: /^TC-CRU-019$/i, severity: Severity.NORMAL },
  ];

  for (const r of rules) {
    if (r.re.test(testCaseId)) return r.severity;
  }
  return Severity.NORMAL;
}

function inferDefectTaxonomy(testCaseId: string): {
  testType: 'happy-path' | 'negative' | 'security' | 'contract' | 'smoke';
  risk: 'revenue' | 'security' | 'data' | 'engineering';
  signalTags: string[];
} {
  const id = testCaseId.toUpperCase();

  if (id.startsWith('TC-HARNESS-') || id.startsWith('TC-FW-')) {
    return {
      testType: 'smoke',
      risk: 'engineering',
      signalTags: ['harness', 'traceability', 'ci-guard', 'api'],
    };
  }

  const isHealth = /TC-(AUTH|AIR|CRU)-001$/.test(id);
  const isAuthValidation = /^TC-AUTH-00(4|5|6|7)$/i.test(testCaseId);
  const isAirValidation = /^TC-AIR-00(5|8|9|10)$/i.test(testCaseId);
  const isCruValidation = /^TC-CRU-00(5|8)$/i.test(testCaseId);

  const isSecurity =
    id.includes('AUTH-013') ||
    id.includes('AUTH-014') ||
    id.includes('AUTH-016') ||
    id.includes('AIR-015') ||
    id.includes('AIR-018') ||
    id.includes('CRU-013') ||
    id.includes('CRU-016');

  const isBooking =
    /AIR-(012|013|014|016|017|018|019)$/.test(id) || /CRU-(010|011|012|014|015|016|017)$/.test(id);

  let testType: 'happy-path' | 'negative' | 'security' | 'contract' | 'smoke' = 'happy-path';
  if (isHealth) testType = 'smoke';
  else if (isSecurity) testType = 'security';
  else if (isAuthValidation || isAirValidation || isCruValidation) testType = 'contract';
  else if (/(TC-AUTH-003|TC-AIR-004|TC-AIR-007|TC-AIR-011|TC-AIR-017|TC-AIR-019|TC-CRU-004|TC-CRU-009|TC-CRU-017)$/i.test(testCaseId))
    testType = 'negative';

  let risk: 'revenue' | 'security' | 'data' | 'engineering' = 'engineering';
  if (isSecurity) risk = 'security';
  else if (isBooking) risk = 'revenue';
  else if (id.includes('SEARCH') || /AIR-006|CRU-006|CRU-007|CRU-019/.test(id)) risk = 'data';

  const signalTags: string[] = ['api', `tc:${id}`];
  if (isHealth) signalTags.push('smoke');
  if (testType === 'contract') signalTags.push('contract', 'validation');
  if (testType === 'security') signalTags.push('security', 'authz');
  if (isBooking) signalTags.push('booking', 'money-path');
  if (/-017$/.test(id) && id.includes('AIR')) signalTags.push('idempotency');
  if (/-015$/.test(id) && id.includes('CRU')) signalTags.push('idempotency');

  return { testType, risk, signalTags };
}

/**
 * Allure grouping strategy:
 * - parentSuite: Epic (ID + name)
 * - suite: Story (ID + name)
 * - epic/story labels: also set so "Behaviors" view can be used
 * - labels: testcase/scenario for traceability
 *
 * Defect-focused enrichments (additive; does not remove any prior metadata fields):
 * - severity (Allure "Severity" classification)
 * - layer = API
 * - package = microservice name (auth-api / airlines-api / cruises-api)
 * - subSuite = scenario id (when present) for finer slicing in Suites view
 * - tags for triage filters (contract/security/booking/etc.)
 * - extra labels for developer navigation (domain/risk/test type)
 */
export async function applyAllureMeta(meta: AllureMeta) {
  const epic = `${meta.epicId} ${meta.epicName}`.trim();
  const story = `${meta.storyId} ${meta.storyName}`.trim();
  const service = serviceFromTestCaseId(meta.testCaseId);
  const sev = inferSeverity(meta.testCaseId);
  const taxonomy = inferDefectTaxonomy(meta.testCaseId);

  await allure.parentSuite(epic);
  await allure.suite(story);
  if (meta.scenarioId) await allure.subSuite(meta.scenarioId);

  await allure.epic(epic);
  await allure.story(story);

  await allure.label('testcase', meta.testCaseId);
  if (meta.scenarioId) await allure.label('scenario', meta.scenarioId);

  await allure.severity(sev);
  await allure.layer('API');
  await allure.label(LabelName.PACKAGE, service);

  // Developer-oriented taxonomy (custom labels; safe + filter-friendly in Allure UI)
  await allure.label('domain', meta.epicName);
  await allure.label('service', service);
  await allure.label('risk', taxonomy.risk);
  await allure.label('test_type', taxonomy.testType);

  // Standard tag widget + fast filtering
  await allure.tags(...taxonomy.signalTags);
}

