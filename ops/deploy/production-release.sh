#!/usr/bin/env bash
set -euo pipefail

component="${1:?Usage: production-release.sh <backend|web> <release-id> <artifact-path>}"
release_id="${2:?Usage: production-release.sh <backend|web> <release-id> <artifact-path>}"
artifact_path="${3:?Usage: production-release.sh <backend|web> <release-id> <artifact-path>}"
app_root="${APP_ROOT:-/var/www/salao}"
shared_root="${app_root}/shared"

case "${component}" in
  backend)
    service_name="salao-backend"
    healthcheck_url="http://127.0.0.1:3100/api/health/ready"
    env_file="${shared_root}/backend.env"
    ;;
  web)
    service_name="salao-web"
    healthcheck_url="http://127.0.0.1:3001/"
    env_file="${shared_root}/web.env"
    ;;
  *)
    echo "Componente invalido: ${component}" >&2
    exit 1
    ;;
esac

component_root="${app_root}/${component}"
releases_dir="${component_root}/releases"
current_link="${component_root}/current"
release_dir="${releases_dir}/${release_id}"
previous_target=""

if [ ! -f "${artifact_path}" ]; then
  echo "Artefato nao encontrado: ${artifact_path}" >&2
  exit 1
fi

if [ ! -f "${env_file}" ]; then
  echo "Arquivo de ambiente nao encontrado: ${env_file}" >&2
  exit 1
fi

if [ -L "${current_link}" ]; then
  previous_target="$(readlink -f "${current_link}")"
fi

mkdir -p "${releases_dir}" "${shared_root}"
rm -rf "${release_dir}"
mkdir -p "${release_dir}"

tar -xzf "${artifact_path}" -C "${release_dir}"
cp "${env_file}" "${release_dir}/.env"

cd "${release_dir}"

if [ "${component}" = "backend" ]; then
  npm ci
  npm run prisma:generate
  npm run prisma:migrate:deploy
  npm run build
  npm prune --omit=dev
else
  npm ci
  NEXT_STANDALONE=true APP_BUILD_ID="${release_id}" npm run build
fi

ln -sfn "${release_dir}" "${current_link}"
sudo systemctl restart "${service_name}"

for attempt in $(seq 1 30); do
  if curl --fail --silent "${healthcheck_url}" > /dev/null; then
    ls -1dt "${releases_dir}"/* 2>/dev/null | tail -n +6 | xargs -r rm -rf
    rm -f "${artifact_path}"
    echo "Deploy concluido: ${component} ${release_id}"
    exit 0
  fi

  sleep 2
done

echo "Healthcheck falhou para ${component}. Iniciando rollback." >&2

if [ -n "${previous_target}" ] && [ -d "${previous_target}" ]; then
  ln -sfn "${previous_target}" "${current_link}"
  sudo systemctl restart "${service_name}"
fi

exit 1
