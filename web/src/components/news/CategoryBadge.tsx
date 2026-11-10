import Link from "next/link";
import type { Category } from "@/lib/cms/directus";

// Колір приходить з CMS, тож перед вставкою в style перевіряємо формат:
// без цього адмін міг би вставити довільний CSS
function safeColor(color: string | null): string | undefined {
  return color && /^#[0-9a-f]{6}$/i.test(color) ? color : undefined;
}

type Props = {
  category: Category;
  asLink?: boolean;
};

export default function CategoryBadge({ category, asLink = false }: Props) {
  const color = safeColor(category.color);
  const className =
    "inline-flex items-center gap-1.5 rounded-full border border-line px-2.5 py-0.5 text-xs";

  const content = (
    <>
      <span
        className="h-2 w-2 rounded-full bg-accent"
        style={color ? { backgroundColor: color } : undefined}
        aria-hidden="true"
      />
      {category.name}
    </>
  );

  return asLink ? (
    <Link href={`/news?category=${category.slug}`} className={`${className} hover:bg-subtle`}>
      {content}
    </Link>
  ) : (
    <span className={className}>{content}</span>
  );
}
