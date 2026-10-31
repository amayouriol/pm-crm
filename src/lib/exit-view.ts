// Leaving a selected profile does not revoke the shared team access cookie.
export async function exitView(actions: {
  cancelQueries: () => Promise<unknown>;
  clearQueries: () => void;
  clearProfile: () => void;
  showProfiles: () => Promise<unknown>;
}) {
  await actions.cancelQueries();
  actions.clearQueries();
  actions.clearProfile();
  await actions.showProfiles();
}