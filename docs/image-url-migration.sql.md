# 图片 URL 数据迁移脚本

## 说明

将数据库中存储的完整图片 URL 转换为相对路径格式。

**转换规则**：
- `http://8.160.178.247:8081/minio/images/xxx.jpg` → `/minio/images/xxx.jpg`

## SQL 迁移脚本

请在 PostgreSQL 中执行以下 SQL：

```sql
-- =============================================
-- 图片 URL 数据迁移
-- 执行时间：约 1-5 分钟（取决于数据量）
-- =============================================

-- 1. 科普文章封面
UPDATE education_articles
SET cover = REPLACE(cover, 'http://8.160.178.247:8081', '')
WHERE cover LIKE 'http://8.160.178.247:8081/minio/%';

-- 查看更新结果
SELECT id, title, cover FROM education_articles WHERE cover LIKE '/minio/%' LIMIT 5;

-- 2. 情报封面
UPDATE intelligences
SET cover = REPLACE(cover, 'http://8.160.178.247:8081', '')
WHERE cover LIKE 'http://8.160.178.247:8081/minio/%';

-- 查看更新结果
SELECT id, title, cover FROM intelligences WHERE cover LIKE '/minio/%' LIMIT 5;

-- 3. 里程碑封面
UPDATE milestones
SET cover = REPLACE(cover, 'http://8.160.178.247:8081', '')
WHERE cover LIKE 'http://8.160.178.247:8081/minio/%';

-- 查看更新结果
SELECT id, title, cover FROM milestones WHERE cover LIKE '/minio/%' LIMIT 5;

-- 4. 里程碑媒体（JSONB 数组）
-- 注意：JSONB 更新需要特殊处理
UPDATE milestones
SET media = (
  SELECT jsonb_agg(
    jsonb_set(element, '{url}', to_jsonb(REPLACE(element->>'url', 'http://8.160.178.247:8081', '')))
  )
  FROM jsonb_array_elements(media) element
)
WHERE media IS NOT NULL
AND media::text LIKE '%http://8.160.178.247:8081/minio/%';

-- 查看更新结果
SELECT id, title, media FROM milestones WHERE media IS NOT NULL LIMIT 5;

-- 5. 用户头像
UPDATE users
SET avatar = REPLACE(avatar, 'http://8.160.178.247:8081', '')
WHERE avatar LIKE 'http://8.160.178.247:8081/minio/%';

-- 查看更新结果
SELECT id, username, avatar FROM users WHERE avatar LIKE '/minio/%' LIMIT 5;

-- 6. 公司 Logo
UPDATE company
SET logo_url = REPLACE(logo_url, 'http://8.160.178.247:8081', '')
WHERE logo_url LIKE 'http://8.160.178.247:8081/minio/%';

-- 查看更新结果
SELECT id, name, logo_url FROM company WHERE logo_url LIKE '/minio/%' LIMIT 5;

-- =============================================
-- 验证迁移结果
-- =============================================

-- 检查是否还有未转换的 URL
SELECT 'education_articles' as table_name, COUNT(*) as remaining
FROM education_articles 
WHERE cover LIKE 'http://8.160.178.247:8081/minio/%'

UNION ALL

SELECT 'intelligences', COUNT(*)
FROM intelligences 
WHERE cover LIKE 'http://8.160.178.247:8081/minio/%'

UNION ALL

SELECT 'milestones', COUNT(*)
FROM milestones 
WHERE cover LIKE 'http://8.160.178.247:8081/minio/%'

UNION ALL

SELECT 'milestones_media', COUNT(*)
FROM milestones 
WHERE media IS NOT NULL AND media::text LIKE '%http://8.160.178.247:8081/minio/%'

UNION ALL

SELECT 'users', COUNT(*)
FROM users 
WHERE avatar LIKE 'http://8.160.178.247:8081/minio/%'

UNION ALL

SELECT 'company', COUNT(*)
FROM company 
WHERE logo_url LIKE 'http://8.160.178.247:8081/minio/%';
```

## 执行步骤

1. **备份数据库**（可选但建议）
   ```bash
   pg_dump -h localhost -U postgres nova_space > nova_space_backup.sql
   ```

2. **执行迁移脚本**
   - 登录 PostgreSQL
   - 逐条执行上述 SQL

3. **验证结果**
   - 执行最后的验证 SQL，确保所有 remaining 值为 0

## 注意事项

- 如果 MinIO URL 前缀与脚本中的不同，请修改 SQL 中的 URL 前缀
- 迁移后，前端代码会自动将相对路径拼接为完整 URL
- 管理端使用 HTTP 公网 IP，客户端使用 HTTPS 域名