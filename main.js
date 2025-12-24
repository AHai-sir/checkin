const gladosCheckIn = async (cookie, index) => {
  if (!cookie) return `账号 ${index}: Cookie 为空`;
  
  const headers = {
    'cookie': cookie.trim(),
    'referer': 'https://glados.rocks/console/checkin',
    'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  };

  try {
    // 1. 签到
    const checkin = await fetch('https://glados.rocks/api/user/checkin', {
      method: 'POST',
      headers: { ...headers, 'content-type': 'application/json' },
      body: '{"token":"glados.one"}',
    }).then(r => r.json());

    // 2. 获取状态
    const status = await fetch('https://glados.rocks/api/user/status', {
      method: 'GET',
      headers,
    }).then(r => r.json());

    const leftDays = status.data ? Math.floor(status.data.leftDays) : '未知';
    return `账号 ${index} [${checkin.message}]: 剩余 ${leftDays} 天`;
  } catch (error) {
    return `账号 ${index} [运行异常]: ${error.message}`;
  }
};

const notify = async (messages) => {
  const token = process.env.NOTIFY;
  if (!token || messages.length === 0) return;

  const body = {
    token,
    title: 'GLaDOS 签到统计',
    content: messages.join('\n\n'), // PushPlus 支持换行
    template: 'markdown',
  };

  try {
    await fetch('https://www.pushplus.plus/send', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body),
    });
    console.log('通知发送成功');
  } catch (err) {
    console.error('通知发送失败:', err);
  }
};

const main = async () => {
  const rawData = process.env.GLADOS || '';
  // 使用 | 分割
  const cookies = rawData.split('|').filter(c => c.trim().length > 0);

  if (cookies.length === 0) {
    console.error('错误: 未找到 GLADOS Secret 变量');
    return;
  }

  console.log(`检测到 ${cookies.length} 个账号，开始执行...`);
  
  const results = [];
  for (let i = 0; i < cookies.length; i++) {
    const res = await gladosCheckIn(cookies[i], i + 1);
    console.log(res);
    results.push(res);
  }

  await notify(results);
};

main();
