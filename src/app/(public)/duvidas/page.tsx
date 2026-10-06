import type { Metadata } from "next";
import type { ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import { ChevronDown, MessageCircle } from "lucide-react";
import { PickupDetails } from "@/components/shared/pickup-details";
import { HoursList } from "@/components/shared/hours-list";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils";
import { getDeliveryFee, getStoreContact } from "@/services/store-settings-service";

export const metadata: Metadata = {
  title: "Dúvidas frequentes",
  description: "Como pedir, formas de pagamento, entrega, retirada e acompanhamento do pedido.",
};

type Question = { question: string; answer: ReactNode };

const LINK_CLASS = "text-link underline-offset-4 hover:underline";

/** Pergunta em acordeão nativo (`<details>`): acessível por teclado e funciona sem JS. */
function FaqItem({ question, answer }: Question) {
  return (
    <details className="group rounded-xl surface open:border-primary/40">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 rounded-xl p-4 font-medium [&::-webkit-details-marker]:hidden">
        {question}
        <ChevronDown
          className="size-4 shrink-0 text-muted-foreground transition-transform group-open:rotate-180"
          aria-hidden="true"
        />
      </summary>
      <div className="space-y-3 px-4 pb-4 text-sm text-muted-foreground">{answer}</div>
    </details>
  );
}

export default async function DuvidasPage() {
  const [contact, deliveryFee] = await Promise.all([getStoreContact(), getDeliveryFee()]);

  // Taxa, endereço e horário vêm do painel — as respostas não ficam desatualizadas.
  const talkToUs = contact.whatsappHref ? (
    <a href={contact.whatsappHref} target="_blank" rel="noopener noreferrer" className={LINK_CLASS}>
      chame a gente no WhatsApp
    </a>
  ) : (
    <Link href="/contato" className={LINK_CLASS}>
      fale com a gente
    </Link>
  );

  const sections: { title: string; questions: Question[] }[] = [
    {
      title: "Pedidos",
      questions: [
        {
          question: "Como faço um pedido?",
          answer: (
            <p>
              Escolha seus doces no{" "}
              <Link href="/cardapio" className={LINK_CLASS}>
                cardápio
              </Link>
              , adicione ao carrinho e finalize no checkout. Para concluir, é só entrar na sua
              conta ou criar uma — leva menos de um minuto.
            </p>
          ),
        },
        {
          question: "Como acompanho meu pedido?",
          answer: (
            <p>
              Em{" "}
              <Link href="/conta/pedidos" className={LINK_CLASS}>
                Minha conta → Pedidos
              </Link>{" "}
              você vê cada etapa, do preparo à entrega. A página atualiza sozinha e você também
              recebe um e-mail quando o status muda.
            </p>
          ),
        },
        {
          question: "Posso cancelar um pedido?",
          answer: (
            <p>
              Sim, enquanto ele estiver &ldquo;Aguardando confirmação&rdquo;: abra o pedido na sua
              conta e toque em &ldquo;Cancelar pedido&rdquo;. Depois que a loja confirmou,{" "}
              {talkToUs}.
            </p>
          ),
        },
        {
          question: "Posso escolher o dia e o horário?",
          answer: (
            <p>
              Pode. No checkout você escolhe o dia e uma janela de 1 hora para receber ou retirar.
              A primeira janela livre já vem marcada, para quem tem pressa.
            </p>
          ),
        },
        {
          question: "O que são os doces sob encomenda?",
          answer: (
            <p>
              Alguns doces são feitos só por encomenda e precisam de alguns dias de preparo — eles
              têm o selo &ldquo;Encomenda&rdquo; no cardápio, com o prazo. Se o carrinho tiver um
              deles, as datas do checkout já começam depois desse prazo.
            </p>
          ),
        },
        {
          question: "Vocês fazem encomendas para festas e datas especiais?",
          answer: (
            <p>
              Fazemos! Para quantidades maiores ou algo personalizado, {talkToUs} com antecedência
              para combinarmos os detalhes.
            </p>
          ),
        },
      ],
    },
    {
      title: "Pagamento",
      questions: [
        {
          question: "Quais formas de pagamento vocês aceitam?",
          answer: (
            <>
              <p>Você escolhe no checkout:</p>
              <ul className="list-disc space-y-1 pl-5">
                <li>Pix ou cartão online, pagos na hora pelo Mercado Pago;</li>
                <li>Pix, cartão ou dinheiro na entrega ou na retirada.</li>
              </ul>
            </>
          ),
        },
        {
          question: "O pagamento online é seguro?",
          answer: (
            <p>
              Sim. O pagamento é processado pelo Mercado Pago, e os dados do seu cartão não passam
              pela nossa loja.
            </p>
          ),
        },
        {
          question: "Tenho um cupom de desconto. Onde uso?",
          answer: (
            <p>
              No resumo do checkout, antes de confirmar o pedido. O desconto vale sobre os doces,
              não sobre a taxa de entrega.
            </p>
          ),
        },
      ],
    },
    {
      title: "Entrega e retirada",
      questions: [
        {
          question: "Quanto custa a entrega?",
          answer: (
            <p>
              {deliveryFee > 0
                ? `A taxa de entrega é de ${formatCurrency(deliveryFee)} e aparece no resumo antes de você confirmar.`
                : "A entrega é grátis."}
            </p>
          ),
        },
        {
          question: "Posso retirar na loja?",
          answer: (
            <>
              <p>
                Pode, e a retirada não tem custo: escolha &ldquo;Retirada&rdquo; no checkout.
                {!contact.pickup && " O endereço aparece na página do pedido."}
              </p>
              {contact.pickup && <PickupDetails pickup={contact.pickup} />}
            </>
          ),
        },
        {
          question: "Qual o horário de funcionamento?",
          answer: <HoursList hours={contact.hours} />,
        },
      ],
    },
    {
      title: "Sobre os doces",
      questions: [
        {
          question: "Tenho alergia ou restrição alimentar. Posso pedir?",
          answer: (
            <>
              <p>
                Na página de cada doce você encontra os ingredientes e os alérgenos (glúten,
                leite, ovos, castanhas, coco, corantes e outros). No{" "}
                <Link href="/cardapio" className={LINK_CLASS}>
                  cardápio
                </Link>
                , os filtros &ldquo;Sem glúten&rdquo;, &ldquo;Sem lactose&rdquo; e &ldquo;Sem
                ovos&rdquo; mostram só os doces com ingredientes informados.
              </p>
              <p>
                Quando um doce pode conter traços de outros alérgenos, isso aparece na página
                dele. Se a restrição for séria, {talkToUs} antes de pedir.
              </p>
            </>
          ),
        },
        {
          question: "Como avalio um doce?",
          answer: (
            <p>
              Depois que o pedido for entregue, o doce aparece em{" "}
              <Link href="/conta" className={LINK_CLASS}>
                Minha conta
              </Link>{" "}
              para você dar sua nota. Também dá para avaliar direto na página do produto.
            </p>
          ),
        },
      ],
    },
  ];

  return (
    <div className="mx-auto max-w-2xl space-y-10 px-4 py-16">
      <div className="flex flex-col items-center gap-4 text-center">
        <Image src="/branding/03_gatinha_chefe_com_flor.png" alt="" width={90} height={132} />
        <div className="space-y-1">
          <p className="font-display text-2xl text-script">Ficou com alguma dúvida?</p>
          <h1 className="font-heading text-3xl font-semibold">Dúvidas frequentes</h1>
        </div>
      </div>

      {sections.map((section) => (
        <section key={section.title} className="space-y-3">
          <h2 className="font-heading text-lg font-medium">{section.title}</h2>
          <div className="space-y-2">
            {section.questions.map((item) => (
              <FaqItem key={item.question} {...item} />
            ))}
          </div>
        </section>
      ))}

      <div className="flex flex-col items-center gap-3 rounded-2xl bg-muted/50 p-6 text-center">
        <p className="font-medium">Não achou o que procurava?</p>
        {contact.whatsappHref ? (
          <Button
            nativeButton={false}
            render={<a href={contact.whatsappHref} target="_blank" rel="noopener noreferrer" />}
          >
            <MessageCircle /> Chamar no WhatsApp
          </Button>
        ) : (
          <Button nativeButton={false} render={<Link href="/contato" />}>
            Falar com a gente
          </Button>
        )}
      </div>
    </div>
  );
}
