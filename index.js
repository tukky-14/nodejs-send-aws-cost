const AWS = require('aws-sdk');
const axios = require('axios');
const costExplorer = new AWS.CostExplorer({ region: 'ap-northeast-1' });

const BASE_URL = 'https://notify-api.line.me/api/notify';
const LINE_TOKEN = process.env.LINE_TOKEN;

exports.handler = async (event) => {
    // 今月の初日を計算
    const startDate = new Date();
    startDate.setDate(1); // 月の初日に設定
    const formattedStartDate = startDate.toISOString().split('T')[0];

    // 今日の日付を取得
    const endDate = new Date().toISOString().split('T')[0];

    const params = {
        TimePeriod: {
            Start: formattedStartDate,
            End: endDate,
        },
        Granularity: 'MONTHLY',
        Metrics: ['UnblendedCost'],
        GroupBy: [
            {
                Type: 'DIMENSION',
                Key: 'SERVICE',
            },
        ],
    };

    try {
        const data = await costExplorer.getCostAndUsage(params).promise();

        // サービス別コストを整形して出力
        let totalCost = 0;
        const outputMessage = [];
        outputMessage.push('\n【AWS Cost Report】');
        data.ResultsByTime.forEach((result) => {
            outputMessage.push(`${result.TimePeriod.Start} ~ ${result.TimePeriod.End}\n`);

            result.Groups.forEach((group) => {
                const serviceName = group.Keys[0];
                const amount = group.Metrics.UnblendedCost.Amount;
                const unit = group.Metrics.UnblendedCost.Unit;
                totalCost += parseFloat(amount);
                if (amount < 0.01) return;

                outputMessage.push(`${serviceName}: $${parseFloat(amount).toFixed(2)}`);
            });
            if (result.Groups.length === 0) {
                console.log('No cost data available for this period.');
            }
        });
        outputMessage.push(`\n💰Total Cost: $${totalCost.toFixed(2)} USD`);

        // コンソールに出力
        console.log(outputMessage.join('\n'));

        // LINE Notify に送信するメッセージを整形
        const sendParams = new URLSearchParams({
            message: outputMessage.join('\n'),
        });

        // LINE Notify に通知を送信するための設定
        const config = {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                Authorization: `Bearer ${LINE_TOKEN}`,
            },
        };

        // LINE Notify に通知を送信
        const res = await axios.post(BASE_URL, sendParams.toString(), config);
        console.log(res.status);

        return {
            statusCode: 200,
            body: JSON.stringify({
                message: 'Cost data retrieved successfully',
                data: data.ResultsByTime,
            }),
        };
    } catch (error) {
        console.error('Error fetching cost data:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({
                message: 'Error fetching cost data',
                error: error.message,
            }),
        };
    }
};
