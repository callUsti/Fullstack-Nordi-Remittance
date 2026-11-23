Start Kafka locally (Native KRaft, without Docker):

bash
make -C Backend-Nordi-remittance kafka-start


Start Backend API (Node.js/Express):

bash
make -C Backend-Nordi-remittance dev

Start Frontend Website (Vite):

bash
make -C Frontend-Nordi-Remittance website


Start Both Frontend Apps (Website + Mobile concurrently):

bash
make -C Frontend-Nordi-Remittance dev


Start Mobile App Only (Expo):

bash
make -C Frontend-Nordi-Remittance mobile


Command to Spin Everything Up (Backend + Local Kafka):

Inside Backend-Nordi-remittance:

bash
make -C Backend-Nordi-remittance dev