import { calculateExpiry } from "./expiry-engine"
import { format, addDays, subDays } from "date-fns"

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(`Assertion failed: ${message}`)
  }
}

function runTests() {
  console.log("=== Running Expiry Engine Tests ===")

  const expiredStr = format(subDays(new Date(), 5), "yyyy-MM-dd")
  const expiringSoonStr = format(addDays(new Date(), 10), "yyyy-MM-dd")
  const activeStr = format(addDays(new Date(), 45), "yyyy-MM-dd")

  // Test Case 1: Expired Record
  {
    const res = calculateExpiry(expiredStr)
    assert(res.status === "expired", "Expected status to be expired")
    assert(res.warningLevel === "critical", "Expected warning level to be critical")
    assert(res.badgeColor === "rose", "Expected badge color to be rose")
    assert(res.remainingDays === -5, "Expected remaining days to be -5")
    assert(res.progressPercentage === 0, "Expected progress to be 0 for expired")
    console.log("✓ Test Case 1: Expired Record passed")
  }

  // Test Case 2: Expiring Soon Record (10 days)
  {
    const res = calculateExpiry(expiringSoonStr)
    assert(res.status === "expiring_soon", "Expected status to be expiring_soon")
    assert(res.warningLevel === "warning", "Expected warning level to be warning for 10 days")
    assert(res.badgeColor === "amber", "Expected badge color to be amber")
    assert(res.remainingDays === 10, "Expected remaining days to be 10")
    console.log("✓ Test Case 2: Expiring Soon Record passed")
  }

  // Test Case 3: Active Record (45 days)
  {
    const res = calculateExpiry(activeStr)
    assert(res.status === "active", "Expected status to be active")
    assert(res.warningLevel === "normal", "Expected warning level to be normal")
    assert(res.badgeColor === "emerald", "Expected badge color to be emerald")
    assert(res.remainingDays === 45, "Expected remaining days to be 45")
    console.log("✓ Test Case 3: Active Record passed")
  }

  // Test Case 4: Progress calculations with custom creation date
  {
    const createdStr = format(subDays(new Date(), 10), "yyyy-MM-dd") // 10 days ago
    const expiryStr = format(addDays(new Date(), 10), "yyyy-MM-dd")   // 10 days from now
    // Total duration is 20 days. Elapsed is 10 days. Progress should be 50%!
    const res = calculateExpiry(expiryStr, createdStr)
    assert(res.progressPercentage === 50, `Expected progress percentage to be 50, got ${res.progressPercentage}`)
    console.log("✓ Test Case 4: Progress Percentage calculation passed")
  }

  console.log("=== All Expiry Engine Tests Passed! ===")
}

try {
  runTests()
} catch (err: unknown) {
  console.error("❌ Test suite failed:")
  if (err instanceof Error) {
    console.error(err.message)
  } else {
    console.error(err)
  }
  process.exit(1)
}
