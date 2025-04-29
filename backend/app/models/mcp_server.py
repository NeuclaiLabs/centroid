import enum
import random
from datetime import datetime
from typing import Any

from sqlalchemy import JSON, Column, DateTime, String, event, func
from sqlmodel import Field, Relationship, SQLModel

from app.core.logger import get_logger
from app.core.security import decrypt_dict, encrypt_dict

from .base import CamelModel

# from .mcp_template import MCPTool
from .user import User

logger = get_logger(__name__, service="mcp_server")

# Lists for generating Docker-style names
ADJECTIVES = [
    "admiring",
    "adoring",
    "affectionate",
    "agitated",
    "amazing",
    "angry",
    "awesome",
    "beautiful",
    "blissful",
    "bold",
    "boring",
    "brave",
    "busy",
    "charming",
    "clever",
    "compassionate",
    "competent",
    "condescending",
    "confident",
    "cranky",
    "crazy",
    "dazzling",
    "determined",
    "distracted",
    "dreamy",
    "eager",
    "ecstatic",
    "elastic",
    "elated",
    "elegant",
    "eloquent",
    "epic",
    "exciting",
    "fervent",
    "festive",
    "flamboyant",
    "focused",
    "friendly",
    "frosty",
    "funny",
    "gallant",
    "gifted",
    "goofy",
    "gracious",
    "happy",
    "hardcore",
    "heuristic",
    "hopeful",
    "hungry",
    "infallible",
    "inspiring",
    "intelligent",
    "interesting",
    "jolly",
    "jovial",
    "keen",
    "kind",
    "laughing",
    "loving",
    "lucid",
    "magical",
    "modest",
    "musing",
    "mystifying",
    "naughty",
    "nervous",
    "nice",
    "nifty",
    "nostalgic",
    "objective",
    "optimistic",
    "peaceful",
    "pedantic",
    "pensive",
    "practical",
    "priceless",
    "quirky",
    "quizzical",
    "relaxed",
    "reverent",
    "romantic",
    "sad",
    "serene",
    "sharp",
    "silly",
    "sleepy",
    "stoic",
    "strange",
    "suspicious",
    "sweet",
    "tender",
    "thirsty",
    "trusting",
    "unruffled",
    "upbeat",
    "vibrant",
    "vigilant",
    "vigorous",
    "wizardly",
    "wonderful",
    "xenodochial",
    "youthful",
    "zealous",
]

NAMES = [
    "albattani",
    "allen",
    "almeida",
    "antonelli",
    "agnesi",
    "archimedes",
    "ardinghelli",
    "aryabhata",
    "austin",
    "babbage",
    "banach",
    "banzai",
    "bardeen",
    "bartik",
    "bassi",
    "beaver",
    "bell",
    "benz",
    "bhabha",
    "bhaskara",
    "black",
    "blackburn",
    "blackwell",
    "bohr",
    "booth",
    "borg",
    "bose",
    "boyd",
    "brahmagupta",
    "brattain",
    "brown",
    "carson",
    "chandrasekhar",
    "shannon",
    "clarke",
    "colden",
    "cori",
    "cray",
    "curran",
    "curie",
    "darwin",
    "davinci",
    "dijkstra",
    "dubinsky",
    "easley",
    "edison",
    "einstein",
    "elion",
    "engelbart",
    "euclid",
    "euler",
    "fermat",
    "fermi",
    "feynman",
    "franklin",
    "galileo",
    "gates",
    "goldberg",
    "goldstine",
    "goldwasser",
    "golick",
    "goodall",
    "gould",
    "greider",
    "grothendieck",
    "hamilton",
    "haslett",
    "hawking",
    "heisenberg",
    "hermann",
    "herschel",
    "hertz",
    "heyrovsky",
    "hodgkin",
    "hoover",
    "hopper",
    "hugle",
    "hypatia",
    "ishizaka",
    "jackson",
    "jang",
    "jennings",
    "jepsen",
    "johnson",
    "joliot",
    "jones",
    "kalam",
    "kapitsa",
    "kare",
    "keldysh",
    "keller",
    "kepler",
    "khorana",
    "kilby",
    "kirch",
    "knuth",
    "kowalevski",
    "lalande",
    "lamarr",
    "lamport",
    "leakey",
    "leavitt",
    "lichterman",
    "liskov",
    "lovelace",
    "lumiere",
    "mahavira",
    "margulis",
    "matsumoto",
    "maxwell",
    "mayer",
    "mccarthy",
    "mcclintock",
    "mclean",
    "mcnulty",
    "meitner",
    "meninsky",
    "mestorf",
    "mirzakhani",
    "moore",
    "morse",
    "murdock",
    "moser",
    "napier",
    "nash",
    "neumann",
    "newton",
    "nightingale",
    "nobel",
    "noether",
    "northcutt",
    "noyce",
    "panini",
    "pare",
    "pascal",
    "pasteur",
    "payne",
    "perlman",
    "pike",
    "poincare",
    "poitras",
    "proskuriakova",
    "ptolemy",
    "raman",
    "ramanujan",
    "ride",
    "montalcini",
    "ritchie",
    "rhodes",
    "robinson",
    "roentgen",
    "rosalind",
    "rubin",
    "saha",
    "sammet",
    "sanderson",
    "satoshi",
    "shamir",
    "shaw",
    "shirley",
    "shockley",
    "shtern",
    "sinoussi",
    "snyder",
    "solomon",
    "spence",
    "stallman",
    "stonebraker",
    "swanson",
    "swartz",
    "swirles",
    "taussig",
    "tesla",
    "tharp",
    "thompson",
    "torvalds",
    "turing",
    "varahamihira",
    "vaughan",
    "visvesvaraya",
    "volhard",
    "villani",
    "wescoff",
    "wilbur",
    "wiles",
    "williams",
    "wilson",
    "wing",
    "wozniak",
    "wright",
    "yalow",
    "yonath",
]


def generate_docker_style_name() -> str:
    """Generate a Docker-style name combining an adjective, a name, and random digits."""
    adjective = random.choice(ADJECTIVES)
    name = random.choice(NAMES)
    # Generate a random 4-digit number
    random_digits = str(random.randint(1000, 9999))
    return f"{adjective}_{name}_{random_digits}"


class MCPServerStatus(str, enum.Enum):
    """Status of an MCP server."""

    ACTIVE = "active"
    INACTIVE = "inactive"


class MCPServerKind(str, enum.Enum):
    """Kind of MCP server."""

    OFFICIAL = "official"
    EXTERNAL = "external"
    OPENAPI = "openapi"


class MCPServerRunConfig(CamelModel):
    """Model for MCP server run configuration."""

    command: str = Field(description="Command to run")
    args: list[str] | None = Field(
        default=None, description="Arguments for the command"
    )
    env: dict[str, str] | None = Field(
        default=None, description="Environment variables"
    )
    cwd: str | None = Field(default=None, description="Working directory")


class MCPServerSearch(CamelModel):
    pass


class MCPServerBase(CamelModel):
    """Base model for MCP servers."""

    name: str = Field(description="Name of the MCP server")
    description: str = Field(description="Description of the MCP server")
    status: MCPServerStatus = Field(
        default=MCPServerStatus.ACTIVE, description="Status of the MCP server"
    )
    kind: MCPServerKind = Field(
        default=MCPServerKind.OFFICIAL, description="Kind of MCP server"
    )
    transport: str = Field(description="Transport type for the MCP server")
    version: str = Field(description="Version of the MCP server")
    url: str = Field(
        default="http://localhost:8000", description="URL of the MCP server"
    )
    run: MCPServerRunConfig | None = Field(
        default=None,
        description="Run configuration for the MCP server",
        sa_column=Column(JSON),
    )
    settings: dict[str, Any] | None = Field(
        default=None, description="Settings for the MCP server", sa_column=Column(JSON)
    )
    # metadata: dict[str, Any] | None = Field(
    #     default=None,
    #     description="Additional metadata for the MCP server",
    #     sa_column=Column(JSON),
    # )
    owner_id: str = Field(
        description="ID of the owner of the MCP server", foreign_key="users.id"
    )


class MCPServerCreate(MCPServerBase):
    """Model for creating an MCP server."""

    pass


class MCPServerUpdate(CamelModel):
    """Model for updating an MCP server."""

    name: str | None = None
    description: str | None = None
    status: MCPServerStatus | None = None
    kind: MCPServerKind | None = None
    transport: str | None = None
    version: str | None = None
    url: str | None = None
    run: MCPServerRunConfig | None = None
    settings: dict[str, Any] | None = None
    metadata: dict[str, Any] | None = None


class MCPServer(MCPServerBase, SQLModel, table=True):
    """Model for MCP servers."""

    __tablename__ = "mcp_servers"

    id: str = Field(
        default_factory=generate_docker_style_name,
        primary_key=True,
        description="Unique identifier for the MCP server",
    )
    created_at: datetime = Field(
        default=None,
        sa_type=DateTime(timezone=True),
        sa_column_kwargs={
            "server_default": func.now(),
        },
        description="Timestamp when the MCP server was created",
    )
    updated_at: datetime = Field(
        default=None,
        sa_type=DateTime(timezone=True),
        sa_column_kwargs={"onupdate": func.now(), "server_default": func.now()},
        description="Timestamp when the MCP server was last updated",
    )
    owner: User = Relationship(back_populates="mcp_servers")
    # tools: list[MCPTool] | None = Field(default=None, sa_type=JSON)
    encrypted_secrets: str | None = Field(
        default=None,
        sa_column=Column("encrypted_secrets", String),
        description="Encrypted secrets for the MCP server",
    )

    def __init__(self, **data):
        secrets = data.pop("secrets", None)
        super().__init__(**data)
        if secrets is not None:
            self.secrets = secrets

    @property
    def secrets(self) -> dict[str, Any] | None:
        """Decrypt and return the secrets."""
        if not self.encrypted_secrets:
            return None
        try:
            return decrypt_dict(self.encrypted_secrets)
        except Exception as e:
            logger.error(f"Error decrypting secrets: {e}")
            return None

    @secrets.setter
    def secrets(self, value: dict[str, Any] | None) -> None:
        """Encrypt and store the secrets."""
        if value is None:
            self.encrypted_secrets = None
            return

        if not isinstance(value, dict):
            raise ValueError("Secrets must be a dictionary")

        self.encrypted_secrets = encrypt_dict(value)

    def model_dump(self, *args, **kwargs) -> dict[str, Any]:
        """Override model_dump to include secrets in the output if requested."""
        exclude = kwargs.pop("exclude", set())
        data = super().model_dump(
            *args, exclude=exclude | {"encrypted_secrets"}, **kwargs
        )

        if "secrets" not in exclude:
            try:
                secrets = self.secrets
                data["secrets"] = secrets
            except Exception as e:
                logger.error(f"Error including secrets in model_dump: {e}")
                data["secrets"] = None

        return data

    @property
    def mount_path(self) -> str:
        """Compute the mount path based on the instance ID."""
        return f"/mcp/{self.id}"


# Event listeners for MCP server lifecycle management
@event.listens_for(MCPServer, "after_insert")
def handle_instance_creation(mapper, connection, target: MCPServer) -> None:  # noqa: ARG001
    """Handle MCP server creation."""
    import asyncio

    # Lazy import to avoid circular dependency
    from app.mcp.mcp_manager import MCPManager

    async def register_and_create_tools():
        manager = MCPManager.get_instance()
        await manager._register_instance(target)
        # Get the MCP server and create tools
        mcp_server = manager.get_mcp_server(target.id)
        if mcp_server:
            mcp_server.create_tools()

    asyncio.create_task(register_and_create_tools())


@event.listens_for(MCPServer, "after_update")
def handle_instance_update(mapper, connection, target: MCPServer) -> None:  # noqa: ARG001
    """Handle MCP server update."""
    import asyncio

    # Lazy import to avoid circular dependency
    from app.mcp.mcp_manager import MCPManager

    manager = MCPManager.get_instance()
    # Check if status changed to inactive
    if target.status == MCPServerStatus.INACTIVE:
        asyncio.create_task(manager._deregister_instance(target.id))
    # Check if status changed to active
    elif target.status == MCPServerStatus.ACTIVE:
        asyncio.create_task(manager._register_instance(target))


@event.listens_for(MCPServer, "after_delete")
def handle_instance_deletion(mapper, connection, target: MCPServer) -> None:  # noqa: ARG001
    """Handle MCP server deletion."""
    import asyncio

    # Lazy import to avoid circular dependency
    from app.mcp.mcp_manager import MCPManager

    if target.id in MCPManager.get_instance()._registry:
        asyncio.create_task(MCPManager.get_instance()._deregister_instance(target.id))


class MCPServerOut(MCPServerBase):
    """Model for MCP server output."""

    id: str
    created_at: datetime
    updated_at: datetime
    mount_path: str
    secrets: dict[str, Any] | None = None


class MCPServerOutNoSecrets(MCPServerBase):
    """Model for MCP server output without secrets."""

    id: str
    created_at: datetime
    updated_at: datetime
    mount_path: str


class MCPServersOut(CamelModel):
    """Model for MCP servers output."""

    data: list[MCPServerOut]
    count: int
