/**
 * ホームページ（ログイン中）のsearchParamsを正規化する
 *
 * 正規化ルール:
 * - mode: `all|memo|todo|diary` 以外は `all` にする。常に `mode` をURLに含める
 * - view: `trash` のみ許可（それ以外は削除）
 * - sortBy: `updatedAt|createdAt` 以外は `updatedAt` にする。常に `sortBy` をURLに含める
 * - sortOrder: `asc|desc` 以外は `desc` にする。常に `sortOrder` をURLに含める
 * - それ以外のクエリ（tags/errorTest等）は保持
 */

const VALID_MODES = ["all", "memo", "todo", "diary"] as const;
const VALID_VIEWS = ["trash"] as const;
const VALID_SORT_BY = ["updatedAt", "createdAt"] as const;
const VALID_SORT_ORDER = ["asc", "desc"] as const;

type ValidMode = (typeof VALID_MODES)[number];
type ValidView = (typeof VALID_VIEWS)[number];
type ValidSortBy = (typeof VALID_SORT_BY)[number];
type ValidSortOrder = (typeof VALID_SORT_ORDER)[number];

export interface NormalizeResult {
  normalized: URLSearchParams;
  changed: boolean;
}

/**
 * searchParamsを正規化する
 * @param input Next.jsのsearchParams（Record<string, string | string[] | undefined>）
 * @returns 正規化されたURLSearchParamsと変更があったかのフラグ
 */
export function normalizeHomeSearchParams(
  input: Record<string, string | string[] | undefined>,
): NormalizeResult {
  const normalized = new URLSearchParams();
  let changed = false;

  // modeの正規化: 常に含める。不正値は`all`にする
  const modeArray = Array.isArray(input.mode) ? input.mode : [input.mode];
  const modeValue = modeArray[0];
  const normalizedMode: ValidMode =
    modeValue && VALID_MODES.includes(modeValue as ValidMode)
      ? (modeValue as ValidMode)
      : "all";
  normalized.set("mode", normalizedMode);
  if (modeValue !== normalizedMode) {
    changed = true;
  }

  // viewの正規化: `trash` のみ許可
  const viewArray = Array.isArray(input.view) ? input.view : [input.view];
  const viewValue = viewArray[0];
  if (viewValue && VALID_VIEWS.includes(viewValue as ValidView)) {
    normalized.set("view", viewValue);
  } else if (viewValue) {
    // 不正なview値は削除（changedフラグを立てる）
    changed = true;
  }

  // sortByの正規化: 常に含める。不正値は`updatedAt`にする
  const sortByArray = Array.isArray(input.sortBy)
    ? input.sortBy
    : [input.sortBy];
  const sortByValue = sortByArray[0];
  const normalizedSortBy: ValidSortBy =
    sortByValue && VALID_SORT_BY.includes(sortByValue as ValidSortBy)
      ? (sortByValue as ValidSortBy)
      : "updatedAt";
  normalized.set("sortBy", normalizedSortBy);
  // sortByが未指定または不正値の場合のみchangedをtrueにする
  if (!sortByValue || sortByValue !== normalizedSortBy) {
    changed = true;
  }

  // sortOrderの正規化: 常に含める。不正値は`desc`にする
  const sortOrderArray = Array.isArray(input.sortOrder)
    ? input.sortOrder
    : [input.sortOrder];
  const sortOrderValue = sortOrderArray[0];
  const normalizedSortOrder: ValidSortOrder =
    sortOrderValue &&
    VALID_SORT_ORDER.includes(sortOrderValue as ValidSortOrder)
      ? (sortOrderValue as ValidSortOrder)
      : "desc";
  normalized.set("sortOrder", normalizedSortOrder);
  // sortOrderが未指定または不正値の場合のみchangedをtrueにする
  if (!sortOrderValue || sortOrderValue !== normalizedSortOrder) {
    changed = true;
  }

  // mode/view/sortBy/sortOrderが複数指定されていた場合も正規化対象とみなす（canonical URLの一意性確保）
  if (Array.isArray(input.mode) && input.mode.length > 1) {
    changed = true;
  }
  if (Array.isArray(input.view) && input.view.length > 1) {
    changed = true;
  }
  if (Array.isArray(input.sortBy) && input.sortBy.length > 1) {
    changed = true;
  }
  if (Array.isArray(input.sortOrder) && input.sortOrder.length > 1) {
    changed = true;
  }

  // それ以外のクエリパラメータは保持（mode/view/sortBy/sortOrder以外）
  Object.entries(input).forEach(([key, value]) => {
    if (
      key === "mode" ||
      key === "view" ||
      key === "sortBy" ||
      key === "sortOrder"
    ) {
      return; // 既に処理済み
    }
    if (value === undefined) {
      return;
    }
    if (Array.isArray(value)) {
      for (const v of value) {
        normalized.append(key, v);
      }
    } else {
      normalized.append(key, value);
    }
  });

  return { normalized, changed };
}
