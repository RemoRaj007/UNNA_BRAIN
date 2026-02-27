from datetime import timedelta

import aioboto3

from app.core.config import get_settings


class R2Service:
    def __init__(self) -> None:
        self.settings = get_settings()

    def _session(self):
        return aioboto3.Session(
            aws_access_key_id=self.settings.r2_access_key_id,
            aws_secret_access_key=self.settings.r2_secret_access_key,
            region_name=self.settings.r2_region,
        )

    async def put_object(self, key: str, content: bytes, content_type: str) -> None:
        async with self._session().client('s3', endpoint_url=self.settings.r2_endpoint_url) as s3:
            await s3.put_object(
                Bucket=self.settings.r2_bucket_name,
                Key=key,
                Body=content,
                ContentType=content_type,
            )

    async def get_object(self, key: str) -> bytes:
        async with self._session().client('s3', endpoint_url=self.settings.r2_endpoint_url) as s3:
            response = await s3.get_object(Bucket=self.settings.r2_bucket_name, Key=key)
            return await response['Body'].read()

    async def get_signed_url(self, key: str) -> str:
        async with self._session().client('s3', endpoint_url=self.settings.r2_endpoint_url) as s3:
            return await s3.generate_presigned_url(
                ClientMethod='get_object',
                Params={'Bucket': self.settings.r2_bucket_name, 'Key': key},
                ExpiresIn=int(timedelta(seconds=self.settings.r2_signed_url_expiry_seconds).total_seconds()),
            )
