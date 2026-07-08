## Plan

1. In `admin-create-free-report`, re-add temporary Gemini diagnostics only around the Gemini generation step:
   - Log the deployed model string used by the function.
   - On Gemini HTTP failure, log status and a short response body.
   - On parse/empty-candidate failures, log the failure label and short body/preview.
   - On `validateNoInventedNumbers` rejection, log a short rejected prose preview.

2. Deploy only the updated `admin-create-free-report` function so the diagnostics run in the backend.

3. Trigger one free-report generation myself if an admin session is available in the preview; otherwise ask you to trigger it once.

4. Read the backend logs for the new failed order and paste back exactly:
   - Gemini HTTP status, if any.
   - Failure label.
   - Validate rejected prose preview, if validation is the failing step.
   - Confirmation that the deployed model string logged is exactly `gemini-2.5-flash`.

5. After we capture the error, remove the temporary diagnostic logs and redeploy the function without changing anything else.