/**
 * ホームページ（ログイン中）のsearchParamsを正規化する
 *
 * 正規化ルール:
 * - mode: `all|memo|todo|diary` 以外は `all` にする。常に `mode` をURLに含める
 * - view: `trash` のみ許可（それ以外は削除）
 * - それ以外のクエリ（tags/errorTest等）は保持
 */

const VALID_MODES = ["all", "memo", "todo", "diary"] as const;
const VALID_VIEWS = ["trash"] as const;

type ValidMode = (typeof VALID_MODES)[number];
type ValidView = (typeof VALID_VIEWS)[number];

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

  // mode/viewが複数指定されていた場合も正規化対象とみなす（canonical URLの一意性確保）
  if (Array.isArray(input.mode) && input.mode.length > 1) {
    changed = true;
  }
  if (Array.isArray(input.view) && input.view.length > 1) {
    changed = true;
  }

  // それ以外のクエリパラメータは保持（mode/view以外）
  Object.entries(input).forEach(([key, value]) => {
    if (key === "mode" || key === "view") {
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
