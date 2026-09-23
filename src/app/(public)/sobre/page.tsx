import Image from "next/image";

export default function SobrePage() {
  return (
    <div className="mx-auto max-w-2xl space-y-8 px-4 py-16">
      <div className="flex flex-col items-center gap-4 text-center">
        <Image src="/branding/30_faixa_misty_doces.png" alt="" width={200} height={91} />
        <h1 className="font-heading text-3xl font-semibold sm:text-4xl">Nossa história</h1>
        <Image
          src="/branding/03_gatinha_chefe_com_flor.png"
          alt="Ilustração da gatinha Misty vestida de confeiteira, segurando uma flor"
          width={190}
          height={279}
        />
      </div>

      <div className="space-y-5 leading-relaxed text-muted-foreground">
        <p>Olá, seja bem-vindo à MistyDoces! 💜</p>

        <p>
          Se você chegou até aqui, provavelmente ficou curioso para saber um pouquinho mais
          sobre a nossa história. E, bem... será um grande prazer contá-la!
        </p>

        <p>
          O nome da nossa loja, assim como o nosso logotipo e os demais elementos que compõem a
          nossa identidade visual, são uma homenagem a uma de nossas gatinhas — mais
          especificamente, à mais velha e mais alucinada por comida. Mas fiquem tranquilos: ela
          só come ração e comidinhas apropriadas para a espécie dela! 😅
        </p>

        <p>
          A Misty Marshmallow (ou Mishas/Ximelou, para os íntimos) foi resgatada nas
          dependências do Centro Universitário UNIPÊ, em João Pessoa, com indícios de
          abandono. :(
        </p>

        <p>
          Ela sempre foi extremamente dócil, a ponto de praticamente se voluntariar para ser
          adotada: no momento do resgate, simplesmente entrou por conta própria na caixa de
          transporte!
        </p>

        <div className="flex justify-center py-2">
          <Image
            src="/branding/21_gatinha_de_costas.png"
            alt="Ilustração da gatinha Misty de costas, com um laço lilás"
            width={140}
            height={215}
          />
        </div>

        <p>
          Desde então, ela tem trazido muita alegria para a nossa casa e tornado nossos dias
          mais iluminados com sua presença — além, é claro, das inúmeras peripécias que apronta
          junto com seus irmãos, Sushi e Mingau.
        </p>

        <p>
          E é justamente dessa vontade de levar um pouquinho de alegria para os nossos dias que
          também nasceu a MistyDoces.
        </p>

        <p>
          A gente acredita que um docinho pode fazer toda a diferença no nosso dia. No meio da
          correria da rotina, até aqueles dias mais difíceis podem ficar um pouquinho mais leves
          quando nos permitimos uma pausa para comer algo que gostamos.
        </p>

        <p>Sabe aquele momento de:</p>

        <p className="text-center font-heading text-xl text-primary">
          &quot;Eu mereço. Hoje eu me mimei.&quot; 🍰✨
        </p>

        <p>
          Foi pensando nisso que unimos a nossa paixão pela culinária com a vontade de
          proporcionar às pessoas esses pequenos momentos de felicidade através de algo simples,
          gostoso e feito com carinho.
        </p>

        <p>
          Cada doce que fazemos carrega um pouquinho dessa ideia: transformar uma pequena pausa
          do dia em um momento especial.
        </p>

        <p>
          Esperamos que você goste dos nossos produtos, volte muitas vezes e, quem sabe, se
          torne um cliente assíduo da MistyDoces.
        </p>

        <p>E pode ficar tranquilo...</p>

        <p>Podemos deixar isso no off. Não vamos contar para o seu personal trainer. 🤫🍫</p>
      </div>

      <div className="flex justify-center pt-2">
        <Image src="/branding/06_tag_feito_com_carinho.png" alt="" width={110} height={110} />
      </div>
    </div>
  );
}
