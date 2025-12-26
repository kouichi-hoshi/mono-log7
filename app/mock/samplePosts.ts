export type SamplePost = {
  id: string;
  category: "メモ" | "ToDo";
  updatedAt: string;
  createdAt: string;
  body: string;
};

export const samplePosts: SamplePost[] = [
  {
    id: "post-001",
    category: "メモ",
    updatedAt: "2025/12/07 14:30",
    createdAt: "2025/12/07 14:30",
    body: "今週のまとめ: タグ機能の要件を確認。モバイル表示ではエディタを優先し、一覧は下にスクロール配置する。",
  },
  {
    id: "post-002",
    category: "ToDo",
    updatedAt: "2025/12/07 13:15",
    createdAt: "2025/12/07 13:15",
    body: "明日やること: 1) スタブ切替の環境変数確認 2) ログインモーダルの文言確定 3) 並び替えボタンのラベル整理。",
  },
  {
    id: "post-003",
    category: "メモ",
    updatedAt: "2025/12/07 11:45",
    createdAt: "2025/12/07 11:45",
    body: "開発メモ: タイムラインは10件ロードを基本にし、スピナーで遷移を抑える。ドラッグ＆ドロップはmd以上で表示。",
  },
  {
    id: "post-004",
    category: "ToDo",
    updatedAt: "2025/12/07 10:20",
    createdAt: "2025/12/07 10:20",
    body: "UIデザインのブラッシュアップ完了。次は認証機能のスタブ実装に着手する。",
  },
  {
    id: "post-005",
    category: "メモ",
    updatedAt: "2025/12/07 09:10",
    createdAt: "2025/12/07 09:10",
    body: "Miroボードからワイヤフレーム情報を取得し、レイアウトを再構成。ヘッダーとエディタの配置を最適化した。",
  },
  {
    id: "post-006",
    category: "ToDo",
    updatedAt: "2025/12/06 18:30",
    createdAt: "2025/12/06 18:30",
    body: "週末のタスク: 1) テスト環境のセットアップ 2) ドキュメントの更新 3) コードレビューの準備",
  },
  {
    id: "post-007",
    category: "メモ",
    updatedAt: "2025/12/06 16:45",
    createdAt: "2025/12/06 16:45",
    body: "レスポンシブデザインの確認。mdブレイクポイントで2カラムレイアウトが正しく動作している。",
  },
  {
    id: "post-008",
    category: "ToDo",
    updatedAt: "2025/12/06 15:00",
    createdAt: "2025/12/06 15:00",
    body: "エラーハンドリングの実装方針を検討。sonner通知とアラートの使い分けを明確にする必要がある。",
  },
  {
    id: "post-009",
    category: "メモ",
    updatedAt: "2025/12/06 13:20",
    createdAt: "2025/12/06 13:20",
    body: "コンポーネント構造の整理。Header、Editor、Timelineを分離して再利用性を高める。",
  },
  {
    id: "post-010",
    category: "ToDo",
    updatedAt: "2025/12/06 11:30",
    createdAt: "2025/12/06 11:30",
    body: "データベーススキーマの設計。投稿テーブルにカテゴリ、ステータス、タグのカラムを追加する。",
  },
  {
    id: "post-011",
    category: "メモ",
    updatedAt: "2025/12/06 09:15",
    createdAt: "2025/12/06 09:15",
    body: "アクセシビリティ対応。aria-labelやaria-hiddenを適切に設定し、スクリーンリーダー対応を強化。",
  },
  {
    id: "post-012",
    category: "ToDo",
    updatedAt: "2025/12/05 17:45",
    createdAt: "2025/12/05 17:45",
    body: "パフォーマンス最適化: 1) 画像の遅延読み込み 2) コード分割 3) メモ化の適用",
  },
  {
    id: "post-013",
    category: "メモ",
    updatedAt: "2025/12/05 15:30",
    createdAt: "2025/12/05 15:30",
    body: "カラーパレットの統一。インディゴとパープルのグラデーションをアクセントカラーとして採用。",
  },
  {
    id: "post-014",
    category: "ToDo",
    updatedAt: "2025/12/05 14:00",
    createdAt: "2025/12/05 14:00",
    body: "統合テストの作成。認証フローとCRUD操作のE2Eテストを実装する。",
  },
  {
    id: "post-015",
    category: "メモ",
    updatedAt: "2025/12/05 12:20",
    createdAt: "2025/12/05 12:20",
    body: "ユーザーフィードバックの収集方法を検討。開発環境でのエラーテスト機能を実装済み。",
  },
  {
    id: "post-016",
    category: "ToDo",
    updatedAt: "2025/12/05 10:45",
    createdAt: "2025/12/05 10:45",
    body: "デプロイ準備: 1) 環境変数の設定 2) ビルドエラーの確認 3) 本番環境での動作確認",
  },
  {
    id: "post-017",
    category: "メモ",
    updatedAt: "2025/12/04 18:20",
    createdAt: "2025/12/04 18:20",
    body: "スタブと本番実装の切り替えポイントを整理。環境変数で制御できるように設計した。",
  },
  {
    id: "post-018",
    category: "ToDo",
    updatedAt: "2025/12/04 16:10",
    createdAt: "2025/12/04 16:10",
    body: "無限スクロール機能の実装。TanStack QueryとServer Actionsを組み合わせて実現する。",
  },
  {
    id: "post-019",
    category: "メモ",
    updatedAt: "2025/12/04 14:30",
    createdAt: "2025/12/04 14:30",
    body: "ゴミ箱機能の設計。ステータス管理と復元機能の実装方針を決定した。",
  },
  {
    id: "post-020",
    category: "ToDo",
    updatedAt: "2025/12/04 12:00",
    createdAt: "2025/12/04 12:00",
    body: "検索機能の要件定義。タイトル、本文、カテゴリ、タグを対象とした全文検索を実装予定。",
  },
];
