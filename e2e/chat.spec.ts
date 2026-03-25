import { test, expect, type Page } from '@playwright/test';

function sseDemoBody() {
  return (
    'data: {"type":"text_delta","text":"Hello"}\n\n' +
    'data: {"type":"text_delta","text":" from demo"}\n\n' +
    'data: {"type":"done"}\n\n'
  );
}

async function gotoWithChatMock(page: Page, sseBody: string) {
  await page.route(
    (url) => url.pathname === '/api/chat',
    async (route) => {
      if (route.request().method() !== 'POST') {
        await route.continue();
        return;
      }
      await route.fulfill({
        status: 200,
        headers: { 'Content-Type': 'text/event-stream; charset=utf-8' },
        body: sseBody,
      });
    },
  );
  await page.goto('/');
}

test('send message shows streamed assistant reply (mocked API)', async ({ page }) => {
  await gotoWithChatMock(page, sseDemoBody());
  await expect(page.getByTestId('thread-item')).toHaveCount(1);

  const composer = page.getByTestId('chat-composer-input');
  await composer.fill('Hi bot');
  await expect(composer).toHaveValue('Hi bot');
  await page.getByTestId('chat-send').click();

  await expect(page.getByTestId('assistant-message')).toContainText('Hello from demo');
});

test('new chat clears conversation context', async ({ page }) => {
  await gotoWithChatMock(
    page,
    'data: {"type":"text_delta","text":"ok"}\n\n' + 'data: {"type":"done"}\n\n',
  );
  await page.getByTestId('new-chat').click();
  const composer = page.getByTestId('chat-composer-input');
  await composer.fill('One');
  await expect(composer).toHaveValue('One');
  await page.getByTestId('chat-send').click();
  await expect(page.getByTestId('assistant-message')).toContainText('ok');

  await page.getByTestId('new-chat').click();
  await expect(page.getByText('Type a message below.')).toBeVisible();
});
