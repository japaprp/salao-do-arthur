const apiBaseUrl = process.env.SMOKE_API_URL ?? 'http://127.0.0.1:3100/api';
const tenantSubdomain = process.env.SMOKE_TENANT_SUBDOMAIN ?? 'barbearia-do-artur';
const clientEmail = process.env.SMOKE_CLIENT_EMAIL ?? 'cliente.demo@barbeariadoartur.app';
const clientPassword = process.env.SMOKE_CLIENT_PASSWORD ?? 'Cliente123!';

async function main() {
  console.log(`Iniciando smoke flow em ${apiBaseUrl}`);

  await request('/health', { method: 'GET' });

  const login = await request('/auth/login', {
    method: 'POST',
    body: {
      tenantSubdomain,
      email: clientEmail,
      password: clientPassword,
    },
  });

  const accessToken = `${login.accessToken ?? ''}`;
  if (accessToken.length === 0) {
    throw new Error('Login retornou sem accessToken.');
  }

  const clientProfile = await request('/clients/me', {
    method: 'GET',
    accessToken,
  });

  const services = await request('/services/active', {
    method: 'GET',
    accessToken,
  });
  if (!Array.isArray(services) || services.length === 0) {
    throw new Error('Nenhum serviço ativo retornado pelo smoke flow.');
  }

  const selectedService = services[0] as { id: string; name?: string };
  const professionals = await request(`/professionals/available/${selectedService.id}`, {
    method: 'GET',
    accessToken,
  });
  if (!Array.isArray(professionals) || professionals.length === 0) {
    throw new Error('Nenhum profissional disponível retornado pelo smoke flow.');
  }

  const selectedProfessional = professionals[0] as { id: string; user?: { name?: string } };
  const date = nextBusinessDayDateOnly();
  const availableSlots = await request(
    `/appointments/available-slots?serviceId=${selectedService.id}&professionalId=${selectedProfessional.id}&date=${date}`,
    {
      method: 'GET',
      accessToken,
    },
  );

  if (!Array.isArray(availableSlots) || availableSlots.length === 0) {
    throw new Error('Nenhum slot disponível retornado pelo smoke flow.');
  }

  const chosenSlot = availableSlots[0] as { startAt: string; label?: string };

  const bookedAppointment = await request('/appointments/book', {
    method: 'POST',
    accessToken,
    body: {
      serviceId: selectedService.id,
      professionalId: selectedProfessional.id,
      scheduledAt: chosenSlot.startAt,
      notes: '[smoke] Reserva criada automaticamente',
    },
  });

  const appointments = await request('/appointments/mine', {
    method: 'GET',
    accessToken,
  });

  if (
    !Array.isArray(appointments) ||
    !appointments.some(
      appointment =>
        typeof appointment === 'object' &&
        appointment !== null &&
        'id' in appointment &&
        appointment.id === bookedAppointment.id,
    )
  ) {
    throw new Error('Agendamento criado não apareceu em /appointments/mine.');
  }

  console.log('Smoke flow concluído com sucesso.');
  console.log(`Cliente: ${clientProfile.user?.name ?? clientEmail}`);
  console.log(`Serviço: ${selectedService.name ?? selectedService.id}`);
  console.log(`Profissional: ${selectedProfessional.user?.name ?? selectedProfessional.id}`);
  console.log(`Slot reservado: ${chosenSlot.label ?? chosenSlot.startAt}`);
  console.log(`Agendamento criado: ${bookedAppointment.id}`);
}

type RequestOptions = {
  method: 'GET' | 'POST';
  accessToken?: string;
  body?: Record<string, unknown>;
};

async function request(path: string, options: RequestOptions) {
  const response = await fetch(`${apiBaseUrl}${path}`, {
    method: options.method,
    headers: {
      'Content-Type': 'application/json',
      ...(options.accessToken ? { Authorization: `Bearer ${options.accessToken}` } : {}),
    },
    body: options.body == null ? undefined : JSON.stringify(options.body),
  });

  const payload = await readJson(response);
  if (!response.ok) {
    throw new Error(
      `Falha em ${options.method} ${path}: ${response.status} ${JSON.stringify(payload)}`,
    );
  }

  return payload;
}

async function readJson(response: Response) {
  const text = await response.text();
  if (text.trim().length === 0) {
    return {};
  }

  try {
    return JSON.parse(text);
  } catch {
    return { raw: text };
  }
}

function nextBusinessDayDateOnly() {
  const date = new Date();
  date.setDate(date.getDate() + 1);

  while (date.getDay() === 0) {
    date.setDate(date.getDate() + 1);
  }

  const year = `${date.getFullYear()}`;
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');
  return `${year}-${month}-${day}`;
}

main().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
