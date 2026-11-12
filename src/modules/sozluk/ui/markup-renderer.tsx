import Link from "next/link";
import { parseSozlukMarkup } from "../domain/markup.ts";
import { sozlukHref } from "./sozluk-links.ts";

export function SozlukMarkupRenderer({
  content,
  isSubdomain,
}: {
  content: string;
  isSubdomain: boolean;
}) {
  const tokens = parseSozlukMarkup(content);

  return (
    <div className="sozluk-entry-body">
      {tokens.map((token, index) => {
        if (token.type === "text") {
          return <span key={index}>{token.value}</span>;
        }
        if (token.type === "bkz") {
          return (
            <span key={index}>
              {"(bkz: "}
              <Link
                href={sozlukHref(`/${token.slug}`, isSubdomain)}
                className="sozluk-bkz"
              >
                {token.target}
              </Link>
              {")"}
            </span>
          );
        }
        if (token.type === "hidden_bkz") {
          return (
            <Link
              key={index}
              href={sozlukHref(`/${token.slug}`, isSubdomain)}
              className="sozluk-bkz"
              title={token.target}
            >
              {token.target}
            </Link>
          );
        }
        if (token.type === "link") {
          return (
            <a
              key={index}
              href={token.url}
              target="_blank"
              rel="noopener noreferrer nofollow"
              className="sozluk-ext-link"
            >
              {token.label}
            </a>
          );
        }
        return (
          <Link
            key={index}
            href={sozlukHref(`/yazar/${encodeURIComponent(token.nick)}`, isSubdomain)}
            className="sozluk-bkz"
          >
            {`@${token.nick}`}
          </Link>
        );
      })}
    </div>
  );
}
