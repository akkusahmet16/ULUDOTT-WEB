export interface FanzinPageContent {
  readonly pageNumber: number;
  readonly imageUrl?: string;
  readonly title?: string;
  readonly type?: "cover" | "page" | "backcover";
}

export interface FanzinIssue {
  readonly id: string;
  readonly issueNumber: number;
  readonly title: string;
  readonly slug: string;
  readonly subtitle: string;
  readonly season: string;
  readonly year: number;
  readonly description: string;
  readonly pageCount: number;
  readonly pdfUrl: string;
  readonly pdfFileSize: string;
  readonly coverImageUrl: string;
  readonly accessType: string;
  readonly publishedAt: string;
  readonly status: "published" | "draft" | "upcoming";
  readonly pages: readonly FanzinPageContent[];
}
