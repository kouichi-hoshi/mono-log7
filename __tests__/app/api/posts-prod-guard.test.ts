// Mock NextResponse.json to avoid relying on real Response implementation.
jest.mock("next/server", () => {
  const original = jest.requireActual("next/server");
  return {
    ...original,
    NextResponse: {
      json: (body: unknown, init?: { status?: number }) => ({
        status: init?.status ?? 200,
        body,
      }),
    },
  };
});

// Minimal fetch primitives polyfill for Next route handlers in Jest (node env).
class HeadersMock {
  constructor(init = {}) {
    this.map = new Map(
      Object.entries(init).map(([k, v]) => [k.toLowerCase(), String(v)]),
    );
  }
  get(key) {
    return this.map.get(key.toLowerCase());
  }
  set(key, value) {
    this.map.set(key.toLowerCase(), String(value));
  }
}

class RequestMock {
  constructor(url, init = {}) {
    this.url = url;
    this.method = init.method || "GET";
    this.headers = new HeadersMock(init.headers || {});
    this._body = init.body;
  }
  async json() {
    return this._body ? JSON.parse(this._body) : null;
  }
  async text() {
    return this._body ?? "";
  }
}

class ResponseMock {
  constructor(body, init = {}) {
    this.body = body;
    this.status = init.status ?? 200;
  }
}

global.Request = RequestMock;
global.Response = ResponseMock;
global.Headers = HeadersMock;

let getPosts: unknown;
let createPost: unknown;
let getPostById: unknown;
let softDelete: unknown;
let restore: unknown;
let hardDelete: unknown;
let emptyTrash: unknown;
let guardProductionPostsApi: unknown;

const originalNodeEnv = process.env.NODE_ENV;

function buildRequest(url: string, init?: RequestInit) {
  return new Request(url, init) as unknown as Request;
}

describe("posts API production guard", () => {
  beforeAll(() => {
    process.env.NODE_ENV = "production";
    // require after polyfill + env set
    ({ GET: getPosts, POST: createPost } = require("@/app/api/posts/route"));
    ({ GET: getPostById } = require("@/app/api/posts/[id]/route"));
    ({ POST: softDelete } = require("@/app/api/posts/[id]/soft/route"));
    ({ POST: restore } = require("@/app/api/posts/[id]/restore/route"));
    ({ DELETE: hardDelete } = require("@/app/api/posts/[id]/hard/route"));
    ({ POST: emptyTrash } = require("@/app/api/posts/empty-trash/route"));
    ({
      guardProductionPostsApi,
    } = require("@/lib/routing/guardProductionPostsApi"));
  });

  afterAll(() => {
    process.env.NODE_ENV = originalNodeEnv;
  });

  it("GET /api/posts returns 403 in production", async () => {
    const res = await getPosts(buildRequest("http://localhost/api/posts"));
    expect(res.status).toBe(403);
  });

  it("POST /api/posts returns 403 in production", async () => {
    const res = await createPost(
      buildRequest("http://localhost/api/posts", {
        method: "POST",
        body: JSON.stringify({
          authorId: "stub-user-1",
          contentJSON: "{}",
          mode: "memo",
        }),
      }),
    );
    expect(res.status).toBe(403);
  });

  it("GET /api/posts/[id] returns 403 in production", async () => {
    const res = await getPostById(
      buildRequest("http://localhost/api/posts/some-id"),
      { params: { id: "some-id" } },
    );
    expect(res.status).toBe(403);
  });

  it("POST /api/posts/[id]/soft returns 403 in production", async () => {
    const res = await softDelete(
      buildRequest("http://localhost/api/posts/some-id/soft"),
      { params: { id: "some-id" } },
    );
    expect(res.status).toBe(403);
  });

  it("POST /api/posts/[id]/restore returns 403 in production", async () => {
    const res = await restore(
      buildRequest("http://localhost/api/posts/some-id/restore"),
      { params: { id: "some-id" } },
    );
    expect(res.status).toBe(403);
  });

  it("DELETE /api/posts/[id]/hard returns 403 in production", async () => {
    const res = await hardDelete(
      buildRequest("http://localhost/api/posts/some-id/hard"),
      { params: { id: "some-id" } },
    );
    expect(res.status).toBe(403);
  });

  it("POST /api/posts/empty-trash returns 403 in production", async () => {
    const res = await emptyTrash(
      buildRequest("http://localhost/api/posts/empty-trash", {
        method: "POST",
        body: JSON.stringify({ authorId: "stub-user-1" }),
      }),
    );
    expect(res.status).toBe(403);
  });
});

describe("guardProductionPostsApi in non-production", () => {
  const originalNodeEnvDev = process.env.NODE_ENV;

  beforeAll(() => {
    process.env.NODE_ENV = "development";
    ({
      guardProductionPostsApi,
    } = require("@/lib/routing/guardProductionPostsApi"));
  });

  afterAll(() => {
    process.env.NODE_ENV = originalNodeEnvDev;
  });

  it("does not block in development", () => {
    expect(guardProductionPostsApi()).toBeNull();
  });
});
