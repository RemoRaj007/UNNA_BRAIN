"""initial

Revision ID: 0001_initial
Revises: 
Create Date: 2026-02-27
"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision = '0001_initial'
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        'audit_logs',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('action', sa.String(length=128), nullable=False),
        sa.Column('user_id', sa.String(length=255), nullable=False),
        sa.Column('resource_id', sa.String(length=255), nullable=True),
        sa.Column('payload', postgresql.JSONB(astext_type=sa.Text()), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_table(
        'file_assets',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('original_filename', sa.String(length=255), nullable=False),
        sa.Column('content_type', sa.String(length=100), nullable=False),
        sa.Column('size_bytes', sa.Integer(), nullable=False),
        sa.Column('r2_key', sa.String(length=512), nullable=False),
        sa.Column('schema_metadata', postgresql.JSONB(astext_type=sa.Text()), nullable=False),
        sa.Column('uploaded_by', sa.String(length=255), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('r2_key'),
    )
    op.create_table(
        'reports',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('file_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('status', sa.String(length=24), nullable=False),
        sa.Column('output_r2_key', sa.String(length=512), nullable=True),
        sa.Column('requested_by', sa.String(length=255), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['file_id'], ['file_assets.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
    )


def downgrade() -> None:
    op.drop_table('reports')
    op.drop_table('file_assets')
    op.drop_table('audit_logs')
