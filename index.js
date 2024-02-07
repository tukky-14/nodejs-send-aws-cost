const AWS = require('aws-sdk');
const costExplorer = new AWS.CostExplorer({ region: 'ap-northeast-1' });

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
        console.log('AWS Cost Report:');
        data.ResultsByTime.forEach((result) => {
            console.log(`Date Range: ${result.TimePeriod.Start} to ${result.TimePeriod.End}`);
            result.Groups.forEach((group) => {
                const serviceName = group.Keys[0];
                const amount = group.Metrics.UnblendedCost.Amount;
                const unit = group.Metrics.UnblendedCost.Unit;
                if (amount < 0.01) return;
                console.log(`${serviceName}: $${parseFloat(amount).toFixed(2)} ${unit}`);
            });
            if (result.Groups.length === 0) {
                console.log('No cost data available for this period.');
            }
        });

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
