-- Add Firefly blog integration fields to blog_posts
ALTER TABLE `blog_posts` ADD COLUMN `pinned` integer DEFAULT 0;
ALTER TABLE `blog_posts` ADD COLUMN `password` text;
ALTER TABLE `blog_posts` ADD COLUMN `password_hint` text;
ALTER TABLE `blog_posts` ADD COLUMN `comment_enabled` integer DEFAULT 1;
ALTER TABLE `blog_posts` ADD COLUMN `license_name` text;
ALTER TABLE `blog_posts` ADD COLUMN `license_url` text;
ALTER TABLE `blog_posts` ADD COLUMN `source_link` text;
ALTER TABLE `blog_posts` ADD COLUMN `lang` text DEFAULT 'zh_CN';
