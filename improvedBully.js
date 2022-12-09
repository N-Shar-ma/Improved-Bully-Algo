class Node {
    constructor(priority, nodeCount, cluster) {
        // The priority also acts as the node's id
        this.priority = priority
        this.maxPriority = nodeCount - 1
        this.cluster = cluster
        this.electionInProgress = false
        this.coordinator = this.maxPriority
        this.alive = true
    }

    isAlive() {
        return this.alive
    }

    maybeSetCoordinator(id) {
        if(!this.alive) return
        // set a new coordinator only if it has higher priority
        this.coordinator = Math.max(this.coordinator, id)
    }

    setCoordinator(id) {
        if(!this.alive) return
        this.coordinator = id
    }

    getLeader() {
        if(!this.alive) return -1
        return this.coordinator
    }

    kill() {
        if(!this.alive) return
        this.alive = false
    }

    holdElection(initiator) {
        if(!this.alive || this.electionInProgress || initiator > this.priority) {
            // if this node is not alive it cannot respond. And if election is already in
            // progress or if the initiator has higher priority then it chooses to not respond
            console.log(this.priority, "is unable to / does not repond to the election message received")
            return -1
        }
        this.electionInProgress = true
        this.coordinator = this.priority
        if(initiator === this.priority) {
            console.log(this.priority, "is holding (starting) election")
            for(let id = 0; id <= this.maxPriority; id++) {
                // initiator sends election message to all other nodes in cluster
                if(id === this.priority) continue
                console.log(this.priority, "sends election message to ", id)
                // initiator compiles all responses and selects the highest responsive node's id
                const maybeLeader = this.cluster.getNodeById(id).holdElection(this.priority)
                this.maybeSetCoordinator(maybeLeader)
            }
            console.log(this.priority, "elects ", this.coordinator, " by selecting the highest priority from the acknowledgements received")
            console.log(this.priority, "sends the id of the new coordinator to all nodes and ends election:")
            // initiator ends the election with the announcement of the new leader node
            this.cluster.terminateElection(this.coordinator)
        }
        else {
            // responds with priority on receiving election message from a lower priority node
            console.log(this.priority, "acknowledges it's avaliablity for leadership")
            return this.priority
        }
    }
}

class Cluster {
    constructor(nodeCount) {
        this.nodeCount = nodeCount
        this.nodes = []
        // create and link all nodes in the cluster setting highest priority node as leader
        for(let priority = 0; priority < nodeCount; priority++) {
            const newNode = new Node(priority, nodeCount, this)
            this.nodes.push(newNode)
        }
    }

    getNodeById(id) {
        return this.nodes[id]
    }

    killNode(id) {
        this.nodes[id].kill()
    }

    killLeader(initiator = Math.floor(Math.random() * (this.nodeCount-1))) {
        // the initiator is chosen randomly unless specified
        this.killNode(this.nodeCount - 1)
        this.nodes[initiator].holdElection(initiator)
    }

    show() {
        // shows details (id and leader) for each alive node
        this.nodes.forEach((node, id) => {
            if(node.isAlive()) {
                console.log("Node ", id, "has leader: ", node.coordinator)
            }
        })
    }

    terminateElection(id) {
        // informs all nodes of the new leader and ends the election state
        this.nodes.forEach(node => {
            node.setCoordinator(id)
            node.electionInProgress = false
        })
    }
}

const myCluster = new Cluster(5)
console.log("Initial state:")
myCluster.show()
console.log("On killing the leader 4:")
myCluster.killLeader()
myCluster.show()