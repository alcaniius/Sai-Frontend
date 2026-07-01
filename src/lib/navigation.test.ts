import { Role, navigation, filterNavigationByRole } from './navigation';

describe('filterNavigationByRole', () => {
  it('returns all shared links for USER', () => {
    const result = filterNavigationByRole(navigation, Role.USER);
    const hrefs = result.map((item) => item.href);

    expect(hrefs).toContain('/');
    expect(hrefs).toContain('/documents');
    expect(hrefs).toContain('/environmental');
    expect(hrefs).not.toContain('/quality');
    expect(hrefs).not.toContain('/education');
    expect(hrefs).not.toContain('/indicators');
  });

  it('returns management links for MANAGER', () => {
    const result = filterNavigationByRole(navigation, Role.MANAGER);
    const hrefs = result.map((item) => item.href);

    expect(hrefs).toContain('/');
    expect(hrefs).toContain('/quality');
    expect(hrefs).toContain('/education');
    expect(hrefs).toContain('/indicators');
  });

  it('returns read-only links for AUDITOR', () => {
    const result = filterNavigationByRole(navigation, Role.AUDITOR);
    const hrefs = result.map((item) => item.href);

    expect(hrefs).toContain('/');
    expect(hrefs).toContain('/documents');
    expect(hrefs).toContain('/environmental');
    expect(hrefs).toContain('/quality');
    expect(hrefs).toContain('/education');
    expect(hrefs).toContain('/indicators');
  });

  it('returns empty array when role is missing', () => {
    const result = filterNavigationByRole(navigation, undefined);
    expect(result).toEqual([]);
  });
});