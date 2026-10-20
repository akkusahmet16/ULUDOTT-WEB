import {
  Children,
  createElement,
  isValidElement,
  type ReactElement,
  type ReactNode,
} from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { expect, it, vi } from "vitest";
import {
  FormBuilder,
  FormCreator,
  OptionsEditor,
} from "../../src/modules/forms/ui/form-builder";
import { emptySettings } from "../../src/modules/forms/ui/form-settings";
import { validateFormDefinition } from "../../src/modules/forms/domain/form-version";
import { evaluateVisibility } from "../../src/modules/forms/domain/condition";

vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh() {} }) }));

it("UluJam etkinliğinin yeni form ekranı takım davranışını koruyan başvuru şablonunu sunar", () => {
  const screen = renderToStaticMarkup(
    createElement(FormCreator, {
      events: [
        {
          id: "40000000-0000-4000-8000-000000000001",
          title: "UluJam 2027",
          kind: "ulujam",
        },
      ],
    }),
  );
  expect(screen).toContain("UluJam başvuru şablonu");
  expect(screen).toContain("Yeni takım kuruyorum");
  expect(screen).toContain("Form başlığı");
  expect(screen).not.toContain("Soru / alan başlığı");
});

it("seçenek düzenleyicisi dahili yanıt anahtarları yerine okunabilir etiketleri gösterir", () => {
  const screen = renderToStaticMarkup(
    createElement(FormBuilder, {
      form: {
        id: "40000000-0000-4000-8000-000000000001",
        status: "draft",
        revision: 1,
        settings: emptySettings,
        definition: validateFormDefinition({
          fields: [
            {
              id: "40000000-0000-4000-8000-000000000002",
              type: "single_choice",
              label: "Katılım",
              options: [
                { value: "secenek-1", label: "Takımımla" },
                { value: "secenek-2", label: "Tek başıma" },
              ],
            },
          ],
        }),
        hasPublished: false,
      },
    }),
  );
  expect(screen).toContain('value="Takımımla"');
  expect(screen).toContain('value="Tek başıma"');
  expect(screen).not.toContain(">secenek-1\nsecenek-2</textarea>");
});

function elements(node: ReactNode): ReactElement<Record<string, unknown>>[] {
  if (!isValidElement<Record<string, unknown>>(node)) return [];
  return [
    node,
    ...Children.toArray(node.props.children as ReactNode).flatMap(elements),
  ];
}

it("seçenek etiketi değişince kayıtlı yanıt değeri ve ona bağlı görünürlük kuralı korunur", () => {
  const options = [
    { value: "secenek-1", label: "Takımımla" },
    { value: "secenek-2", label: "Tek başıma" },
  ];
  let edited = options;
  const editor = OptionsEditor({
    options,
    onChange: (next) => {
      edited = next;
    },
  });
  const input = elements(editor).find(
    (element) =>
      element.type === "input" && element.props.value === "Takımımla",
  )!;
  (input.props.onChange as (event: unknown) => void)({
    target: { value: "Yeni takım adı" },
  });
  expect(edited).toEqual([
    { value: "secenek-1", label: "Yeni takım adı" },
    { value: "secenek-2", label: "Tek başıma" },
  ]);
  const definition = validateFormDefinition({
    fields: [
      {
        id: "40000000-0000-4000-8000-000000000002",
        type: "single_choice",
        label: "Katılım",
        options: edited,
      },
      {
        id: "40000000-0000-4000-8000-000000000003",
        type: "short_text",
        label: "Takım adı",
        condition: {
          op: "eq",
          fieldId: "40000000-0000-4000-8000-000000000002",
          value: "secenek-1",
        },
      },
    ],
  });
  expect(
    evaluateVisibility(definition, {
      "40000000-0000-4000-8000-000000000002": "secenek-1",
    }),
  ).toContain("40000000-0000-4000-8000-000000000003");
});

it("seçenek sıralaması değişince değerler etiketleriyle birlikte taşınır", () => {
  const options = [
    { value: "solo", label: "Tek başına" },
    { value: "new", label: "Yeni takım" },
  ];
  let edited = options;
  const editor = OptionsEditor({
    options,
    onChange: (next) => {
      edited = next;
    },
  });
  const button = elements(editor).find(
    (element) =>
      element.type === "button" &&
      element.props["aria-label"] === "1. seçeneği aşağı taşı",
  )!;
  (button.props.onClick as () => void)();
  expect(edited).toEqual([
    { value: "new", label: "Yeni takım" },
    { value: "solo", label: "Tek başına" },
  ]);
});

it("yeni seçenek eklemek eski yanıt değerlerini korur ve yinelenmeyen kimlik üretir", () => {
  const options = [{ value: "secenek-1", label: "İlk seçenek" }];
  let edited = options;
  const editor = OptionsEditor({
    options,
    onChange: (next) => {
      edited = next;
    },
  });
  const button = elements(editor).find(
    (element) =>
      element.type === "button" && element.props.children === "Seçenek ekle",
  )!;
  (button.props.onClick as () => void)();
  expect(edited[0]).toEqual({ value: "secenek-1", label: "İlk seçenek" });
  expect(edited[1]).toEqual({
    value: expect.any(String),
    label: "Yeni seçenek",
  });
  expect(edited[1].value).not.toBe("secenek-1");
  expect(new Set(edited.map((item) => item.value)).size).toBe(2);
});

it("seçenek girişleri sunucunun metin ve seçenek sayısı sınırlarını uygular", () => {
  const options = Array.from({ length: 50 }, (_, index) => ({
    value: `secenek-${index}`,
    label: `Seçenek ${index}`,
  }));
  const editor = OptionsEditor({ options, onChange() {} });
  const inputs = elements(editor).filter((element) => element.type === "input");
  expect(inputs.every((input) => input.props.maxLength === 160)).toBe(true);
  const add = elements(editor).find(
    (element) =>
      element.type === "button" && element.props.children === "Seçenek ekle",
  )!;
  expect(add.props.disabled).toBe(true);
});
