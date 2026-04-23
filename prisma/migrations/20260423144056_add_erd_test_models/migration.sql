-- CreateTable
CREATE TABLE "erd_test_author" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "bio" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "erd_test_author_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "erd_test_book" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "isbn" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "publishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "erd_test_book_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "erd_test_tag" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "erd_test_tag_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "erd_test_book_tag" (
    "bookId" TEXT NOT NULL,
    "tagId" TEXT NOT NULL,

    CONSTRAINT "erd_test_book_tag_pkey" PRIMARY KEY ("bookId","tagId")
);

-- CreateIndex
CREATE UNIQUE INDEX "erd_test_author_email_key" ON "erd_test_author"("email");

-- CreateIndex
CREATE UNIQUE INDEX "erd_test_book_isbn_key" ON "erd_test_book"("isbn");

-- CreateIndex
CREATE INDEX "erd_test_book_authorId_idx" ON "erd_test_book"("authorId");

-- CreateIndex
CREATE UNIQUE INDEX "erd_test_tag_name_key" ON "erd_test_tag"("name");

-- AddForeignKey
ALTER TABLE "erd_test_book" ADD CONSTRAINT "erd_test_book_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "erd_test_author"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "erd_test_book_tag" ADD CONSTRAINT "erd_test_book_tag_bookId_fkey" FOREIGN KEY ("bookId") REFERENCES "erd_test_book"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "erd_test_book_tag" ADD CONSTRAINT "erd_test_book_tag_tagId_fkey" FOREIGN KEY ("tagId") REFERENCES "erd_test_tag"("id") ON DELETE CASCADE ON UPDATE CASCADE;
