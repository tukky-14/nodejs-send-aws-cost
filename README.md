## AWS Lambda 関数を使用して LINE に通知を送信する

### 概要

この AWS Lambda 関数は、現在の月の AWS のコストデータを取得し、LINE Notify を介して詳細なレポートを送信するように設計されています。この関数は AWS サービスごとにグループ化された合計未結合コストを計算し、コストの内訳を指定された LINE アカウントに通知で送信します。
定期的にコストを監視することで、予期しないコスト増加を特定し、AWS の使用を最適化して費用を節約することができます。

### 前提条件

-   **Node.js**: この関数は JavaScript で書かれており、AWS Lambda にデプロイするために Node.js が必要です。
-   **AWS アカウント**: AWS アカウントと Lambda 関数を作成し、AWS Cost Explorer にアクセスするための適切な権限が必要です。
-   **LINE Notify トークン**: LINE にメッセージを送信するためには、LINE Notify アクセストークンが必要です。このトークンは、LINE Notify にサービスを登録することで取得できます。

### 依存関係

この Lambda 関数は、以下の NPM パッケージを使用しています:

-   `aws-sdk`: JavaScript 用の AWS SDK で、AWS Cost Explorer を含む AWS サービスとのやり取りに使用されます。
-   `axios`: プロミスベースの HTTP クライアントで、LINE Notify API への HTTP リクエストを送信するために使用されます。

これらの依存関係を Lambda 関数パッケージに含めることを忘れないでください。

### セットアップ

1. **IAM ロールの作成**: Cost Explorer にアクセスする権限を持つ IAM ロールを作成して作成する Lambda 関数に設定します。
2. **Lambda 関数のデプロイ**:
    - AWS マネジメントコンソールで新しい Lambda 関数を作成します。
    - Node.js ランタイムを選択します。
    - ソースを圧縮してアップロードします。
    - `LINE_TOKEN`環境変数に LINE Notify アクセストークンを設定します。
3. **トリガーの設定**: Lambda 関数のトリガーをニーズに基づいて設定します（例: Amazon Event Bridge を使用したスケジュールされたイベント）。

### 関数のロジック

1. **日付範囲の計算**: 関数は、コストデータを取得するための現在の月の開始日と終了日を計算します。
2. **コストデータの取得**: 指定された日付範囲に対して、AWS サービスごとにグループ化された未結合コストを取得するために AWS Cost Explorer API を使用します。
3. **メッセージのフォーマット**: 取得したコストデータをサービスごとのコストの概要と総コストを含む読みやすいメッセージにフォーマットします。
4. **通知の送信**: フォーマットされたメッセージを LINE Notify API を介して LINE に送信します。

### 環境変数

-   `LINE_TOKEN`: LINE Notify API への HTTP リクエストを認証するために使用される LINE Notify アクセストークン。
-   Lambda 関数の環境変数に設定します。

### エラーハンドリング

関数には基本的なエラーハンドリングが含まれており、コストデータの取得や LINE への通知の送信に失敗した場合には CloudWatch Logs にエラーをログに記録し、500 のエラーステータスコードを返します。

### セキュリティ上の考慮事項

-   Lambda 関数に使用される IAM ロールは、その操作に必要な最小限のアクセス権限を持つようにしてください。
-   LINE Notify アクセストークンを保護し、コードや公開可能なプラットフォームで露出させないようにしてください。

### コマンド

圧縮

```bash
# linux/mac
zip -r function_name.zip .

# windows command prompt
powershell Compress-Archive -Path * -DestinationPath function_name.zip

# windows powershell
Compress-Archive -Path * -DestinationPath function_name.zip
```
