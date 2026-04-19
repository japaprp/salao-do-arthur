#!/usr/bin/env bash
set -euo pipefail

component="${1:?Usage: production-rollback.sh <backend|web>}"
app_root="${APP_ROOT:-/var/www/salao}"

case "${component}" in
  backend)
    service_name="salao-backend"
    healthcheck_url="http://127.0.0.1:3100/api/health/ready"
    ;;
  web)
    service_name="salao-web"
    healthcheck_url="http://127.0.0.1:3001/"
    ;;
  *)
    echo "Componente invalido: ${component}" >&2
    exit 1
    ;;
esac

component_root="${app_root}/${component}"
releases_dir="${component_root}/releases"
current_link="${component_root}/current"

if [ ! -L "${current_link}" ]; then
  echo "Link current ausente para ${component}" >&2
  exit 1
fi

current_target="$(readlink -f "${current_link}")"
previous_target="$(
  ls -1dt "${releases_dir}"/* 2>/dev/null | while read -r release_dir; do
    if [ "${release_dir}" != "${current_target}" ]; then
      echo "${release_dir}"
      break
    fi
  done
)"

if [ -z "${previous_target}" ]; then
  echo "Nenhuma release anterior disponivel para ${component}" >&2
  exit 1
fi

ln -sfn "${previous_target}" "${current_link}"
sudo systemctl restart "${service_name}"

for attempt in $(seq 1 30); do
  if curl --fail --silent "${healthcheck_url}" > /dev/null; then
    echo "Rollback concluido: ${component} -> ${previous_target}"
    exit 0
  fi

  sleep 2
done

echo "Rollback falhou para ${component}" >&2
exit 1
