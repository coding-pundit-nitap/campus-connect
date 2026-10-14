import { beforeEach, describe, expect, it, vi } from "vitest";

const { createTransport, sendMail } = vi.hoisted(() => {
  const sendMail = vi.fn();
  return { sendMail, createTransport: vi.fn(() => ({ sendMail })) };
});
vi.mock("nodemailer", () => ({ default: { createTransport } }));
vi.mock("./logger.js", async () =>
  (await import("../../tests/helpers/workers/index.js")).loggerModule()
);

const smtp = {
  SMTP_HOST: "smtp.example.com",
  SMTP_PORT: "587",
  SMTP_USER: "bot@example.com",
  SMTP_PASS: "pw",
  ALERT_EMAIL_FROM: "alerts@example.com",
};

async function load(env: Partial<typeof smtp> = {}) {
  vi.resetModules();
  vi.doMock("./env.js", () => ({ env: { ...smtp, ...env } }));
  const email = await import("./email.js");
  const logger = await import("./logger.js");
  return { ...email, loggers: logger.loggers };
}

const params = {
  to: "user@example.com",
  recipientName: "Ada",
  title: "Order ready",
  message: "Pick it up",
  actionUrl: "https://app.example/orders/1",
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe("email transport setup", () => {
  it("creates an SMTP transport from env", async () => {
    await load();

    expect(createTransport).toHaveBeenCalledWith({
      host: "smtp.example.com",
      port: 587,
      secure: false,
      auth: { user: "bot@example.com", pass: "pw" },
    });
  });

  it("uses TLS on port 465", async () => {
    await load({ SMTP_PORT: "465" });

    expect(createTransport).toHaveBeenCalledWith(
      expect.objectContaining({ port: 465, secure: true })
    );
  });

  it("defaults the port to 587 when SMTP_PORT is empty", async () => {
    await load({ SMTP_PORT: "" });

    expect(createTransport).toHaveBeenCalledWith(
      expect.objectContaining({ port: 587 })
    );
  });

  it.each([
    ["SMTP_HOST", { SMTP_HOST: "" }],
    ["a numeric SMTP_PORT", { SMTP_PORT: "abc" }],
    ["SMTP_USER", { SMTP_USER: "" }],
    ["SMTP_PASS", { SMTP_PASS: "" }],
  ])("disables email and warns without %s", async (_label, env) => {
    const { sendNotificationEmail, loggers } = await load(env);

    expect(createTransport).not.toHaveBeenCalled();
    expect(loggers.notification.warn).toHaveBeenCalledWith(
      expect.stringContaining("Email notifications are disabled")
    );
    await expect(sendNotificationEmail(params)).resolves.toBe(false);
    expect(sendMail).not.toHaveBeenCalled();
  });
});

describe("sendNotificationEmail", () => {
  it("sends a branded email with text and HTML bodies", async () => {
    const { sendNotificationEmail } = await load();

    await expect(sendNotificationEmail(params)).resolves.toBe(true);

    const mail = sendMail.mock.calls[0][0];
    expect(mail).toMatchObject({
      from: "alerts@example.com",
      to: "user@example.com",
      subject: "[Campus Connect] Order ready",
      text: "Order ready\n\nPick it up\n\nOpen: https://app.example/orders/1",
    });
    expect(mail.html).toContain("Hello Ada,");
    expect(mail.html).toContain('href="https://app.example/orders/1"');
  });

  it("falls back to SMTP_USER as the sender", async () => {
    const { sendNotificationEmail } = await load({ ALERT_EMAIL_FROM: "" });

    await sendNotificationEmail(params);

    expect(sendMail.mock.calls[0][0].from).toBe("bot@example.com");
  });

  it.each([null, undefined])(
    "omits the action link when actionUrl is %s",
    async (actionUrl) => {
      const { sendNotificationEmail } = await load();

      await sendNotificationEmail({ ...params, actionUrl });

      const mail = sendMail.mock.calls[0][0];
      expect(mail.text).toBe("Order ready\n\nPick it up");
      expect(mail.html).not.toContain("View Details");
    }
  );

  it.each([null, undefined, ""])(
    "greets 'there' when recipientName is %j",
    async (recipientName) => {
      const { sendNotificationEmail } = await load();

      await sendNotificationEmail({ ...params, recipientName });

      expect(sendMail.mock.calls[0][0].html).toContain("Hello there,");
    }
  );

  it("escapes HTML in the name, title and message", async () => {
    const { sendNotificationEmail } = await load();

    await sendNotificationEmail({
      ...params,
      recipientName: `<b>"Bo" & 'Co'</b>`,
      title: "<script>x</script>",
      message: "a & b",
    });

    const { html, subject } = sendMail.mock.calls[0][0];
    expect(html).toContain(
      "Hello &lt;b&gt;&quot;Bo&quot; &amp; &#039;Co&#039;&lt;/b&gt;,"
    );
    expect(html).toContain("&lt;script&gt;x&lt;/script&gt;");
    expect(html).toContain("<p>a &amp; b</p>");
    expect(html).not.toContain("<script>");
    expect(subject).toBe("[Campus Connect] <script>x</script>");
  });

  it("propagates SMTP failures", async () => {
    const { sendNotificationEmail } = await load();
    sendMail.mockRejectedValueOnce(new Error("550 rejected"));

    await expect(sendNotificationEmail(params)).rejects.toThrow("550 rejected");
  });
});
