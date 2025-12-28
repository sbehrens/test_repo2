// Example test to verify Jest configuration
describe('Example Test Suite', () => {
  it('should pass a simple test', () => {
    expect(1 + 1).toBe(2);
  });

  it('should handle string operations', () => {
    const result = 'Activity Reminder App';
    expect(result).toContain('Activity');
    expect(result).toContain('Reminder');
  });
});
