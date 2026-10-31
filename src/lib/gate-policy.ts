export function hasTeamAccess(data: { unlocked?: boolean }): boolean {
  return data.unlocked === true;
}