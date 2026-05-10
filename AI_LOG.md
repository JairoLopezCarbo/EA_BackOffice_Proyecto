El present document detalla els punts on s'ha fet ús d'IA.

Les eines d'IA utilitzades han estat:
- ChatGPT: Per consultes concretes en punts concrets del codi i quan s' ha treballat sobre un únic archiu.
- GithubCopilot: Per revisions de codi on es vol que el model tingui el context total del projecte.

LLISTAT D'USOS:

ÚS 1:
- Eina: GithubCopilot
- Pregunta/objectiu: Adaptació de Data.ts per a resposta de History
- Prompt literal:
                "Actualitza Data.ts perquè el DataService pugui gestionar tant respostes paginades com arrays directes a History, mantenint la normalització comuna de dades i la compatibilitat amb la paginació existent"
- Incoherències detectades: La primera versió només contemplava una part dels formats de resposta del backend.
- Solució/adaptació manual: S'ha revisat i ajustat manualment la normalització per garantir compatibilitat amb ambdós formats sense trencar la resta de tipus.

ÚS 2:
- Eina: GithubCopilot
- Pregunta/objectiu: Adaptació de Data-manager-page per a History
- Prompt literal:
                "Actualitza Data-manager-page per integrar History en mode només lectura, connectar el botó view details, gestionar l'estat del modal i mantenir la mateixa paginació que users, routes i points"
- Incoherències detectades: Inicialment es mantenien comportaments d'edició i selecció que no tocaven a History.
- Solució/adaptació manual: S'ha ajustat la pàgina manualment per desactivar edició/selecció en History i assegurar l'obertura/tancament correcte del modal.

ÚS 3:
- Eina: GithubCopilot
- Pregunta/objectiu: Creació de la vista de detalls de History
- Prompt literal:
                "Crea una vista per History-details amb una finestra que mostri el resum de l'historial i el llistat complet dels changes associats. Mantén la pàgina de History en mode només lectura i afegeix paginació i botó de view details"
- Incoherències detectades: No mostrava bé els valors de STATUS ni el detall dels changes.
- Solució/adaptació manual: S'ha ajustat la normalització i la presentació manualment per assegurar que els canvis se vegin correctament.

REVISIÓ FINAL DE CODI AMB IA:
ÚS R1:
- Eina: GithubCopilot
- Pregunta/objectiu: Revisar el codi en busca de millores o simplificacions que poden haver estat omeses
- Prompt literal:
                "Arxiu Prompt Revisió"
- Millores proposades: Aplicar codificació de colors per cada entrada del registry segons el tipus d'acció (CREATE, MODIFY, STATUS, DELETE) per facilitar la lectura visual.
- Solució/adaptació manual: Es demana a la IA aplicar-ho a través de la modificació del CSS de la taula.