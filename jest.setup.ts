import "@testing-library/jest-dom";

// window.matchMedia のモック
Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: jest.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

// JSDOM では Pointer Events の一部APIが未実装なため、sonner が利用する
// setPointerCapture / releasePointerCapture を最低限ポリフィルする。
// （トーストのスワイプdismiss内部で呼ばれる）
if (!("setPointerCapture" in HTMLElement.prototype)) {
  // biome-ignore lint/suspicious/noExplicitAny: テスト環境のポリフィルのため
  (HTMLElement.prototype as any).setPointerCapture = () => {};
}
if (!("releasePointerCapture" in HTMLElement.prototype)) {
  // biome-ignore lint/suspicious/noExplicitAny: テスト環境のポリフィルのため
  (HTMLElement.prototype as any).releasePointerCapture = () => {};
}
