import { expect, test, type APIRequestContext } from "@playwright/test";

test("shows already used differently", async ({ page, request }) => {
  const scenario = await prepare(request);
  await page.goto(`/?backend=${scenario.backend}`);
  await expect(page.getByText("test event")).toBeVisible();

  await expect(page.getByText("Present your QR code")).toBeVisible();
  await page.keyboard.type("A1B2C3\n");
  await expect(page.getByTestId("Check-in result")).toHaveAttribute(
    "data-result",
    "Checked in"
  );
  await expect(page.getByText("John Doe")).toBeVisible();
  await expect(page.getByText("Regular")).toBeVisible();

  await page.keyboard.type("\n");
  await expect(page.getByText("Present your QR code")).toBeVisible();
  await page.keyboard.type("A1B2C3\n");
  await expect(page.getByTestId("Check-in result")).toHaveAttribute(
    "data-result",
    "Already used"
  );
  await expect(page.getByText("John Doe")).toBeVisible();
  await expect(page.getByText("Regular")).toBeVisible();
});

test("allows checking with different people", async ({ page, request }) => {
  const scenario = await prepare(request);
  await page.goto(`/?backend=${scenario.backend}`);
  await expect(page.getByText("test event")).toBeVisible();

  await expect(page.getByText("Present your QR code")).toBeVisible();
  await page.keyboard.type("A1B2C3\n");
  await expect(page.getByTestId("Check-in result")).toHaveAttribute(
    "data-result",
    "Checked in"
  );
  await expect(page.getByText("John Doe")).toBeVisible();
  await expect(page.getByText("Regular")).toBeVisible();

  await page.keyboard.type("D4E5F6\n");
  await expect(page.getByTestId("Check-in result")).toHaveAttribute(
    "data-result",
    "Already used"
  );
  await expect(page.getByText("Jane Doe")).toBeVisible();
  await expect(page.getByText("VIP")).toBeVisible();
});

test("allows undo", async ({ page, request }) => {
  const scenario = await prepare(request);
  await page.goto(`/?backend=${scenario.backend}`);
  await expect(page.getByText("test event")).toBeVisible();

  await expect(page.getByText("Present your QR code")).toBeVisible();
  await page.keyboard.type("A1B2C3\n");
  await expect(page.getByTestId("Check-in result")).toHaveAttribute(
    "data-result",
    "Checked in"
  );

  await page.keyboard.type("undo\n");
  await expect(page.getByText("undone")).toBeVisible();

  await page.keyboard.type("A1B2C3\n");
  await expect(page.getByTestId("Check-in result")).toHaveAttribute(
    "data-result",
    "Checked in"
  );
});

test("displays message for invalid code", async ({ page, request }) => {
  const scenario = await prepare(request);
  await page.goto(`/?backend=${scenario.backend}`);
  await expect(page.getByText("test event")).toBeVisible();

  await expect(page.getByText("Present your QR code")).toBeVisible();
  await page.keyboard.type("WTFBBQ\n");
  await expect(page.getByText("Invalid code")).toBeVisible();
});

async function prepare(request: APIRequestContext) {
  const eventId = crypto.randomUUID();
  await Promise.all(
    [
      {
        ticketTypeId: 10001,
        firstname: "John",
        lastname: "Doe",
        referenceCode: "A1B2C3",
      },
      {
        ticketTypeId: 10002,
        firstname: "Jane",
        lastname: "Doe",
        referenceCode: "D4E5F6",
      },
    ].map(async (params) => {
      const response = await request.post(
        `https://mockapis.onrender.com/dtinth/kio/events/${eventId}/_test/register`,
        { data: params }
      );
      expect(response.status()).toBe(200);
    })
  );
  return {
    backend: `https://mockapis.onrender.com/dtinth/kio/events/${eventId}`,
  };
}
