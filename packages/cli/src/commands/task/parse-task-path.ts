export function parseTaskPath(taskPath: string): { storyId: string; taskId: string } {
  const parts = taskPath.split('/');
  const [storyId, taskId] = parts;
  if (parts.length !== 2 || !storyId?.trim() || !taskId?.trim()) {
    throw new Error(`Invalid task path "${taskPath}". Expected format: STORY-001/TASK-001`);
  }
  return { storyId, taskId };
}
