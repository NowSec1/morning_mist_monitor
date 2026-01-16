import mysql from 'mysql2/promise';

async function diagnoseUser() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || 'root',
    database: process.env.DB_NAME || 'morning_mist_db',
  });

  try {
    console.log('=== 数据库诊断开始 ===\n');

    // 检查users表结构
    console.log('1. 检查users表结构：');
    const [columns] = await connection.query('DESCRIBE users');
    console.log(columns);
    console.log('\n');

    // 检查用户名为test的用户
    console.log('2. 查询用户名为test的用户：');
    const [users] = await connection.query(
      'SELECT id, username, email, name, authType, isActive, createdAt, lastSignedIn FROM users WHERE username = ?',
      ['test']
    );
    console.log('查询结果数量:', users.length);
    if (users.length > 0) {
      console.log('用户信息:', users[0]);
    } else {
      console.log('未找到用户名为test的用户');
    }
    console.log('\n');

    // 检查所有本地用户
    console.log('3. 查询所有本地用户：');
    const [localUsers] = await connection.query(
      'SELECT id, username, email, name, authType, isActive FROM users WHERE authType = ? LIMIT 10',
      ['local']
    );
    console.log('本地用户数量:', localUsers.length);
    console.log('本地用户列表:', localUsers);
    console.log('\n');

    // 检查用户表中是否有password字段
    console.log('4. 检查password字段：');
    const passwordColumn = columns.find(col => col.Field === 'password');
    if (passwordColumn) {
      console.log('✓ password字段存在');
      console.log('  类型:', passwordColumn.Type);
      console.log('  可为空:', passwordColumn.Null);
    } else {
      console.log('✗ password字段不存在');
    }
    console.log('\n');

    // 检查用户表中是否有authType字段
    console.log('5. 检查authType字段：');
    const authTypeColumn = columns.find(col => col.Field === 'authType');
    if (authTypeColumn) {
      console.log('✓ authType字段存在');
      console.log('  类型:', authTypeColumn.Type);
    } else {
      console.log('✗ authType字段不存在');
    }
    console.log('\n');

    // 检查用户表中是否有isActive字段
    console.log('6. 检查isActive字段：');
    const isActiveColumn = columns.find(col => col.Field === 'isActive');
    if (isActiveColumn) {
      console.log('✓ isActive字段存在');
      console.log('  类型:', isActiveColumn.Type);
    } else {
      console.log('✗ isActive字段不存在');
    }

    console.log('\n=== 诊断完成 ===');
  } catch (error) {
    console.error('诊断失败:', error);
  } finally {
    await connection.end();
  }
}

diagnoseUser();
