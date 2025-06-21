# Backend Technical Backlog

## High Priority

### 1. Add Unit Tests for Images Route
**Issue**: The images route (`/api/games/:roomId/generate-image`) currently lacks unit test coverage.

**Background**: During the backend refactoring, we encountered difficulties mocking the OpenAI client in the test environment. The OpenAI instance is created at the module level, making it challenging to mock properly in Jest.

**Proposed Solutions**:
1. **Dependency Injection**: Refactor the images route to accept the OpenAI client as a dependency
   ```typescript
   // Example approach
   export function createImagesRouter(openaiClient: OpenAI) {
     const router = Router();
     // ... route implementation using injected client
     return router;
   }
   ```

2. **Mock Server**: Use a mock OpenAI server for integration testing
   - Tools like `msw` (Mock Service Worker) could intercept HTTP requests
   - More realistic testing of the actual HTTP interactions

3. **Factory Pattern**: Create an OpenAI client factory that can be easily mocked
   ```typescript
   // openai-factory.ts
   export const createOpenAIClient = () => new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
   ```

**Acceptance Criteria**:
- [ ] Images route has at least 80% test coverage
- [ ] Tests cover successful image generation
- [ ] Tests cover error scenarios (API failures, invalid requests)
- [ ] Tests verify proper game state updates after image generation

**Estimated Effort**: 4-6 hours

---

## Medium Priority

### 2. Add Integration Tests
- Set up test database for integration testing
- Test complete user flows across multiple endpoints
- Ensure data consistency across operations

### 3. API Documentation
- Add Swagger/OpenAPI documentation
- Document all endpoints with request/response examples
- Include authentication requirements

---

## Low Priority

### 4. Performance Optimizations
- Add database query optimization
- Implement caching for frequently accessed data
- Add rate limiting for API endpoints

### 5. Enhanced Error Handling
- Create custom error classes
- Implement centralized error handling middleware
- Add better error logging and monitoring