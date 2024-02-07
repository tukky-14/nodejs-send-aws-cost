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
        let totalCost = 0;
        const outputMessage = [];
        outputMessage.push('【AWS Cost Report】');
        data.ResultsByTime.forEach((result) => {
            outputMessage.push(`${result.TimePeriod.Start} ~ ${result.TimePeriod.End}\n`);

            result.Groups.forEach((group) => {
                const serviceName = group.Keys[0];
                const amount = group.Metrics.UnblendedCost.Amount;
                const unit = group.Metrics.UnblendedCost.Unit;
                totalCost += parseFloat(amount);
                if (amount < 0.01) return;

                outputMessage.push(`${serviceName}: $${parseFloat(amount).toFixed(2)} ${unit}`);
            });
            if (result.Groups.length === 0) {
                console.log('No cost data available for this period.');
            }
        });
        outputMessage.push(`\n💰Total Cost: $${totalCost.toFixed(2)} USD`);
        console.log(outputMessage.join('\n'));

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
