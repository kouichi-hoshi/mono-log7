import { jest } from "@jest/globals";

function createRouterMock() {
  return {
    refresh: jest.fn(),
    push: jest.fn(),
    replace: jest.fn(),
  };
}

type RouterMock = ReturnType<typeof createRouterMock>;

let searchParams = new URLSearchParams();
let routerMock: RouterMock = createRouterMock();

export const useRouter = () => routerMock;

export const useSearchParams = () => searchParams;

export const __setSearchParams = (
  entries?: Record<string, string | undefined>,
) => {
  searchParams = new URLSearchParams();
  if (!entries) {
    return searchParams;
  }
  Object.entries(entries).forEach(([key, value]) => {
    if (value !== undefined) {
      searchParams.set(key, value);
    }
  });
  return searchParams;
};

export const __resetSearchParams = () => {
  searchParams = new URLSearchParams();
  return searchParams;
};

export const __setRouterMock = (overrides?: Partial<RouterMock>) => {
  routerMock = {
    ...createRouterMock(),
    ...overrides,
  };
  return routerMock;
};

export const __resetRouterMock = () => {
  routerMock = createRouterMock();
  return routerMock;
};
